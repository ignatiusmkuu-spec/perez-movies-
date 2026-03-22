/**
 * ═══════════════════════════════════════════════════════════
 *  IGNITE MOVIES — SILENT REVERSE-PROXY STREAMING ENGINE
 * ═══════════════════════════════════════════════════════════
 *
 * How it works
 * ─────────────
 * 1. Client sends: GET /stream/hls/{token}/master.m3u8
 * 2. Backend validates JWT token → gets movieId
 * 3. Backend fetches real HLS master playlist from external server
 * 4. Backend rewrites ALL segment/variant URLs → point back to /stream/seg/{token}/{base64url}
 * 5. Client receives playlist with ONLY our domain in every URL
 * 6. Every subsequent segment request goes through /stream/seg/{token}/{base64url}.ts
 * 7. Backend decodes, fetches, pipes segment with cache headers
 *
 * Result: the user's browser NEVER sees the original stream URL.
 * ═══════════════════════════════════════════════════════════
 */

import { Router } from 'express'
import fetch from 'node-fetch'
import https from 'https'
import { verifyStreamToken, extractClientIp, signStreamToken } from './token.js'
import { listSources } from './db.js'

const router = Router()

/* ── Tuning ── */
const SEGMENT_CACHE_TTL_MS = 5 * 60 * 1000     // cache segments 5 min
const PLAYLIST_CACHE_TTL_MS = 10 * 1000         // cache playlists 10 s
const FETCH_TIMEOUT_MS = 10_000
const MAX_CACHE_BYTES = 256 * 1024 * 1024        // 256 MB in-process cache

/* ── In-memory segment cache ── */
const segCache = new Map()    // key → { buf, mime, ts, size }
let cacheBytes = 0

function cacheGet(key) {
  const entry = segCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > SEGMENT_CACHE_TTL_MS) {
    segCache.delete(key)
    cacheBytes -= entry.size
    return null
  }
  return entry
}

function cacheSet(key, buf, mime, ttl = SEGMENT_CACHE_TTL_MS) {
  // Evict oldest entries if over limit
  while (cacheBytes + buf.length > MAX_CACHE_BYTES && segCache.size > 0) {
    const oldest = segCache.keys().next().value
    const e = segCache.get(oldest)
    segCache.delete(oldest)
    cacheBytes -= e.size
  }
  segCache.set(key, { buf, mime, ts: Date.now(), size: buf.length, ttl })
  cacheBytes += buf.length
}

/* ── HTTPS agent (ignore cert errors for upstream) ── */
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

/* ── Safe fetch ── */
async function proxyFetch(url, headers = {}) {
  const agent = url.startsWith('https') ? httpsAgent : undefined
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IgniteProxy/1.0)',
      'Referer':    new URL(url).origin + '/',
      'Origin':     new URL(url).origin,
      ...headers,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    agent,
  })
  if (!res.ok) throw new Error(`Upstream ${res.status}: ${url}`)
  return res
}

/* ── Resolve relative URL to absolute ── */
function resolveUrl(base, relative) {
  try {
    return new URL(relative, base).href
  } catch {
    return relative
  }
}

/* ── Encode / decode segment URL ── */
const enc = (url) => Buffer.from(url).toString('base64url')
const dec = (b64) => Buffer.from(b64, 'base64url').toString('utf8')

/* ── Build our proxy URL for a segment ── */
function proxySegUrl(req, token, absoluteUrl) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http'
  const host  = req.headers['x-forwarded-host']  || req.headers.host
  const base  = `${proto}://${host}`
  const encoded = enc(absoluteUrl)
  return `${base}/stream/seg/${token}/${encoded}`
}

/* ── Rewrite HLS (.m3u8) playlist to use our proxy URLs ── */
function rewriteM3u8(content, baseUrl, req, token) {
  const lines = content.split('\n')
  const out   = []

  for (const raw of lines) {
    const line = raw.trim()

    // Handle EXT-X-KEY (encryption key URI)
    if (line.startsWith('#EXT-X-KEY')) {
      const rewritten = line.replace(/URI="([^"]+)"/, (_, uri) => {
        const abs = resolveUrl(baseUrl, uri)
        return `URI="${proxySegUrl(req, token, abs)}"`
      })
      out.push(rewritten)
      continue
    }

    // Handle EXT-X-MAP (initialisation segment)
    if (line.startsWith('#EXT-X-MAP')) {
      const rewritten = line.replace(/URI="([^"]+)"/, (_, uri) => {
        const abs = resolveUrl(baseUrl, uri)
        return `URI="${proxySegUrl(req, token, abs)}"`
      })
      out.push(rewritten)
      continue
    }

    // Skip other comment / tag lines unchanged
    if (line.startsWith('#') || line === '') {
      out.push(raw)
      continue
    }

    // Segment / variant URL line → rewrite
    const abs = resolveUrl(baseUrl, line)
    out.push(proxySegUrl(req, token, abs))
  }

  return out.join('\n')
}

/* ── Rewrite MPEG-DASH manifest ── */
function rewriteMpd(content, baseUrl, req, token) {
  // Rewrite BaseURL elements and segment URLs inside the XML
  return content
    .replace(/(<BaseURL>)([^<]+)(<\/BaseURL>)/g, (_, open, url, close) => {
      const abs = resolveUrl(baseUrl, url.trim())
      return `${open}${proxySegUrl(req, token, abs)}${close}`
    })
    .replace(/initialization="([^"]+)"/g, (_, url) => {
      const abs = resolveUrl(baseUrl, url)
      return `initialization="${proxySegUrl(req, token, abs)}"`
    })
    .replace(/media="([^"]+)"/g, (_, url) => {
      // DASH media templates — encode the template pattern
      const abs = resolveUrl(baseUrl, url)
      return `media="${proxySegUrl(req, token, abs)}"`
    })
}

/* ═══════════════════════════════════════════════════════════
   AUTH MIDDLEWARE — validate JWT token on all /stream/ routes
   ═══════════════════════════════════════════════════════════ */
function authStream(req, res, next) {
  const token = req.params.token || req.query.t
  if (!token) {
    return res.status(401).json({ error: 'Stream token required' })
  }

  const ip = extractClientIp(req)
  const result = verifyStreamToken(token, ip)

  if (!result.valid) {
    return res.status(403).json({ error: `Stream denied: ${result.reason}` })
  }

  req.streamToken   = token
  req.streamPayload = result.payload
  next()
}

/* ═══════════════════════════════════════════════════════════
   HLS MASTER PLAYLIST PROXY
   GET /stream/hls/:token/master.m3u8
   GET /stream/hls/:token/master.m3u8?src=<base64url-encoded-url>
   ═══════════════════════════════════════════════════════════ */
router.get('/hls/:token/master.m3u8', authStream, async (req, res) => {
  const { token } = req.params
  const { sub: movieId } = req.streamPayload

  // src param allows overriding the stream URL (for flexibility)
  let streamUrl = req.query.src ? dec(req.query.src) : null

  if (!streamUrl) {
    // Look up from DB
    const sources = listSources(movieId)
    const hlsSrc  = sources.find(s => s.protocol === 'hls' && s.isActive) || sources[0]
    if (!hlsSrc) {
      return res.status(404).json({ error: 'No HLS source found for this movie' })
    }
    streamUrl = hlsSrc.url || hlsSrc.cdnUrl
  }

  const cacheKey = `m3u8:${streamUrl}`
  const cached   = cacheGet(cacheKey)
  if (cached) {
    res.setHeader('Content-Type', 'application/x-mpegURL')
    res.setHeader('X-Cache', 'HIT')
    addStreamHeaders(res)
    return res.send(cached.buf.toString('utf8'))
  }

  try {
    const upstream = await proxyFetch(streamUrl)
    const text     = await upstream.text()
    const rewritten = rewriteM3u8(text, streamUrl, req, token)

    cacheSet(cacheKey, Buffer.from(rewritten), 'application/x-mpegURL', PLAYLIST_CACHE_TTL_MS)

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
    res.setHeader('X-Cache', 'MISS')
    addStreamHeaders(res)
    res.send(rewritten)
  } catch (err) {
    console.error('[Proxy] HLS master error:', err.message)
    res.status(502).json({ error: 'Failed to fetch HLS playlist', detail: err.message })
  }
})

/* ═══════════════════════════════════════════════════════════
   HLS VARIANT PLAYLIST PROXY (when URL is a variant stream)
   GET /stream/hls/:token/var/:base64url
   ═══════════════════════════════════════════════════════════ */
router.get('/hls/:token/var/:encoded', authStream, async (req, res) => {
  const { token, encoded } = req.params
  const cleanEncoded = encoded.replace(/\.m3u8$/, '')
  let streamUrl

  try {
    streamUrl = dec(cleanEncoded)
  } catch {
    return res.status(400).json({ error: 'Invalid encoded URL' })
  }

  const cacheKey = `var:${streamUrl}`
  const cached   = cacheGet(cacheKey)
  if (cached) {
    res.setHeader('Content-Type', 'application/x-mpegURL')
    res.setHeader('X-Cache', 'HIT')
    addStreamHeaders(res)
    return res.send(cached.buf.toString('utf8'))
  }

  try {
    const upstream = await proxyFetch(streamUrl)
    const text     = await upstream.text()
    const rewritten = rewriteM3u8(text, streamUrl, req, token)

    cacheSet(cacheKey, Buffer.from(rewritten), 'application/x-mpegURL', PLAYLIST_CACHE_TTL_MS)

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
    res.setHeader('X-Cache', 'MISS')
    addStreamHeaders(res)
    res.send(rewritten)
  } catch (err) {
    console.error('[Proxy] Variant playlist error:', err.message)
    res.status(502).json({ error: 'Failed to fetch variant playlist' })
  }
})

/* ═══════════════════════════════════════════════════════════
   SEGMENT / ANY RESOURCE PROXY
   GET /stream/seg/:token/:base64url
   (handles .ts segments, .aac audio, init.mp4, encryption keys)
   ═══════════════════════════════════════════════════════════ */
router.get('/seg/:token/:encoded', authStream, async (req, res) => {
  const { encoded } = req.params
  let segUrl

  try {
    segUrl = dec(encoded)
  } catch {
    return res.status(400).send('Invalid segment reference')
  }

  // Serve from cache if available
  const cacheKey = `seg:${segUrl}`
  const cached   = cacheGet(cacheKey)
  if (cached) {
    res.setHeader('Content-Type', cached.mime)
    res.setHeader('X-Cache', 'HIT')
    res.setHeader('Cache-Control', 'private, max-age=300')
    addSegmentHeaders(res)
    return res.send(cached.buf)
  }

  try {
    const upstream   = await proxyFetch(segUrl)
    const mime       = upstream.headers.get('content-type') || guessMime(segUrl)
    const buf        = Buffer.from(await upstream.arrayBuffer())

    // Cache only smaller segments (< 10 MB)
    if (buf.length < 10 * 1024 * 1024) {
      cacheSet(cacheKey, buf, mime)
    }

    res.setHeader('Content-Type', mime)
    res.setHeader('Content-Length', buf.length)
    res.setHeader('X-Cache', 'MISS')
    res.setHeader('Cache-Control', 'private, max-age=300')
    addSegmentHeaders(res)
    res.send(buf)
  } catch (err) {
    console.error('[Proxy] Segment error:', err.message, segUrl?.slice(0, 80))
    res.status(502).send('Segment unavailable')
  }
})

/* ═══════════════════════════════════════════════════════════
   DASH MANIFEST PROXY
   GET /stream/dash/:token/manifest.mpd
   ═══════════════════════════════════════════════════════════ */
router.get('/dash/:token/manifest.mpd', authStream, async (req, res) => {
  const { token } = req.params
  const { sub: movieId } = req.streamPayload

  let streamUrl = req.query.src ? dec(req.query.src) : null

  if (!streamUrl) {
    const sources = listSources(movieId)
    const dashSrc = sources.find(s => s.protocol === 'dash' && s.isActive)
    if (!dashSrc) return res.status(404).json({ error: 'No DASH source for this movie' })
    streamUrl = dashSrc.url || dashSrc.cdnUrl
  }

  try {
    const upstream  = await proxyFetch(streamUrl)
    const text      = await upstream.text()
    const rewritten = rewriteMpd(text, streamUrl, req, token)

    res.setHeader('Content-Type', 'application/dash+xml')
    addStreamHeaders(res)
    res.send(rewritten)
  } catch (err) {
    console.error('[Proxy] DASH error:', err.message)
    res.status(502).json({ error: 'Failed to fetch DASH manifest' })
  }
})

/* ═══════════════════════════════════════════════════════════
   CONVENIENCE — generate proxy URL for any known HLS URL
   POST /stream/proxy-url   body: { movieId, rawUrl? }
   Returns a ready-to-use proxied HLS master URL + token
   ═══════════════════════════════════════════════════════════ */
router.post('/proxy-url', async (req, res) => {
  const { movieId, rawUrl, quality = 'auto', protocol = 'hls' } = req.body || {}
  if (!movieId) return res.status(400).json({ error: 'movieId required' })

  const clientIp = extractClientIp(req)

  const { token } = signStreamToken({ movieId, quality, protocol, clientIp })

  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http'
  const host  = req.headers['x-forwarded-host']  || req.headers.host
  const base  = `${proto}://${host}`

  let proxyUrl
  if (rawUrl) {
    const encoded = enc(rawUrl)
    proxyUrl = protocol === 'dash'
      ? `${base}/stream/dash/${token}/manifest.mpd?src=${encoded}`
      : `${base}/stream/hls/${token}/master.m3u8?src=${encoded}`
  } else {
    proxyUrl = protocol === 'dash'
      ? `${base}/stream/dash/${token}/manifest.mpd`
      : `${base}/stream/hls/${token}/master.m3u8`
  }

  res.json({ success: true, data: { token, proxyUrl, protocol, quality } })
})

/* ═══════════════════════════════════════════════════════════
   CACHE STATS
   GET /stream/cache/stats
   ═══════════════════════════════════════════════════════════ */
router.get('/cache/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      entries:  segCache.size,
      bytes:    cacheBytes,
      mb:       (cacheBytes / 1024 / 1024).toFixed(2),
      maxMb:    MAX_CACHE_BYTES / 1024 / 1024,
    },
  })
})

/* ─── Helpers ─── */
function addStreamHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range')
  res.setHeader('X-Content-Type-Options',        'nosniff')
  res.setHeader('X-Frame-Options',               'SAMEORIGIN')
  res.setHeader('Cache-Control',                 'private, max-age=10')
  res.setHeader('X-Proxy',                       'IgniteMovies/1.0')
}

function addSegmentHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Accept-Ranges',               'bytes')
  res.setHeader('X-Content-Type-Options',       'nosniff')
  res.setHeader('X-Proxy',                      'IgniteMovies/1.0')
  // Prevent direct download cues
  res.removeHeader('Content-Disposition')
}

function guessMime(url) {
  if (url.includes('.ts'))   return 'video/mp2t'
  if (url.includes('.m4s'))  return 'video/iso.segment'
  if (url.includes('.mp4'))  return 'video/mp4'
  if (url.includes('.aac'))  return 'audio/aac'
  if (url.includes('.m3u8')) return 'application/vnd.apple.mpegurl'
  if (url.includes('.mpd'))  return 'application/dash+xml'
  if (url.includes('.key'))  return 'application/octet-stream'
  return 'application/octet-stream'
}

export default router
