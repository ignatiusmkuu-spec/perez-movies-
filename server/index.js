import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import https from 'https'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const STREAM_SOURCES = {
  movie: [
    (imdb) => `https://moviesapi.to/movie/${imdb}`,
    (imdb) => `https://www.2embed.cc/embed/${imdb}`,
    (imdb) => `https://vidsrc.xyz/embed/movie?imdb=${imdb}`,
    (imdb) => `https://vidsrc.pm/embed/movie/${imdb}`,
    (imdb) => `https://flixerz.to/embed/movie/${imdb}`,
    (imdb) => `https://embedder.cc/e/?imdb=${imdb}`,
  ],
  tv: [
    (imdb, s, e) => `https://moviesapi.to/tv/${imdb}-${s}-${e}`,
    (imdb, s, e) => `https://www.2embed.cc/embedtv/${imdb}&s=${s}&e=${e}`,
    (imdb, s, e) => `https://vidsrc.xyz/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
  ],
}

app.get('/api/sources/:type/:imdb', (req, res) => {
  const { type, imdb } = req.params
  const { s = 1, e = 1 } = req.query
  const sources = (STREAM_SOURCES[type] || STREAM_SOURCES.movie).map(fn => ({
    url: fn(imdb, s, e),
  }))
  res.json({ sources })
})

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

async function proxyFetch(targetUrl, res, extraHeaders = {}) {
  const parsed = new URL(targetUrl)
  const upstream = await fetch(targetUrl, {
    agent: httpsAgent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': parsed.origin,
      ...extraHeaders,
    },
    redirect: 'follow',
  })
  return { upstream, parsed }
}

app.use('/stream-proxy', async (req, res) => {
  const target = req.query.target
  if (!target) return res.status(400).send('Missing target URL')

  try {
    const { upstream } = await proxyFetch(target, res)
    const contentType = upstream.headers.get('content-type') || 'text/html'
    res.set('Content-Type', contentType)
    res.set('Access-Control-Allow-Origin', '*')

    const body = await upstream.text()
    const baseUrl = upstream.url || target
    const baseOrigin = new URL(baseUrl).origin

    const patched = body
      .replace(/<head>/i, `<head><base href="${baseOrigin}/">`)
      .replace(/x-frame-options/gi, 'x-frame-removed')

    res.send(patched)
  } catch (err) {
    console.error('Proxy error:', err.message)
    res.status(502).send('Proxy error: ' + err.message)
  }
})

app.get('/api/imgproxy', async (req, res) => {
  const src = req.query.src
  if (!src) return res.status(400).send('Missing src')
  try {
    const { upstream } = await proxyFetch(src, res, {
      Accept: 'image/webp,image/avif,image/*,*/*',
    })
    const ct = upstream.headers.get('content-type') || 'image/jpeg'
    res.set('Content-Type', ct)
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Cache-Control', 'public, max-age=86400')
    const buf = await upstream.arrayBuffer()
    res.send(Buffer.from(buf))
  } catch (err) {
    res.status(502).send('Image proxy error: ' + err.message)
  }
})

app.use('/api/moviebox', async (req, res) => {
  const path = req.path
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const target = `https://h5-api.aoneroom.com/wefeed-h5api-bff${path}${query}`

  try {
    const upstream = await fetch(target, {
      agent: httpsAgent,
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'origin': 'https://moviebox.ph',
        'referer': 'https://moviebox.ph/',
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    res.set('Content-Type', 'application/json; charset=utf-8')
    res.set('Access-Control-Allow-Origin', '*')

    const text = await upstream.text()
    res.send(text)
  } catch (err) {
    console.error('MovieBox proxy error:', err.message)
    res.status(502).json({ error: 'MovieBox proxy error', message: err.message })
  }
})

let _flixerCache = null
let _flixerCacheAt = 0
const FLIXER_TTL = 10 * 60 * 1000

function parseFlixerHtml(html) {
  const movies = []
  const seen = new Set()
  const linkRe = /href="(\/movie\/watch-[^"]+)"[^>]*title="([^"]+)"/g
  const posterRe = /data-src="(https:\/\/f\.woowoowoowoo[^"]+)"/g
  const yearRe = /<span class="fdi-item"[^>]*>(\d{4})<\/span>/g
  const qualityRe = /<span class="film-poster-quality">([^<]+)<\/span>/g

  const links = [...html.matchAll(linkRe)]
  const posters = [...html.matchAll(posterRe)]
  const years = [...html.matchAll(yearRe)]
  const qualities = [...html.matchAll(qualityRe)]

  links.forEach((m, idx) => {
    const href = m[1]
    if (seen.has(href)) return
    seen.add(href)
    const idMatch = href.match(/(\d+)$/)
    const i = movies.length
    movies.push({
      id: idMatch ? idMatch[1] : String(idx),
      title: m[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
      href,
      poster: posters[i]?.[1] || '',
      year: years[i]?.[1] || '',
      quality: qualities[i]?.[1]?.trim() || 'HD',
      _source: 'flixer',
    })
  })
  return movies
}

app.get('/api/flixer/movies', async (req, res) => {
  if (_flixerCache && Date.now() - _flixerCacheAt < FLIXER_TTL) {
    return res.json({ movies: _flixerCache })
  }
  try {
    const upstream = await fetch('https://theflixertv.to/movie', {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://theflixertv.to/',
      },
    })
    const html = await upstream.text()
    const movies = parseFlixerHtml(html)
    _flixerCache = movies
    _flixerCacheAt = Date.now()
    res.set('Access-Control-Allow-Origin', '*')
    res.json({ movies })
  } catch (err) {
    res.status(502).json({ error: 'Flixer fetch error', message: err.message })
  }
})

const TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://9.rarbg.com:2810/announce',
  'udp://exodus.desync.com:6969/announce',
].map(t => `&tr=${encodeURIComponent(t)}`).join('')

function makeMagnet(hash, name) {
  return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}${TRACKERS}`
}

function guessQuality(name) {
  const n = name.toLowerCase()
  if (n.includes('2160p') || n.includes('4k') || n.includes('uhd')) return '4K'
  if (n.includes('1080p')) return '1080p'
  if (n.includes('720p'))  return '720p'
  if (n.includes('480p'))  return '480p'
  if (n.includes('360p'))  return '360p'
  return 'SD'
}

function formatSize(bytes) {
  const b = parseInt(bytes) || 0
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB'
  if (b >= 1e6) return (b / 1e6).toFixed(0) + ' MB'
  return b + ' B'
}

app.get('/api/download', async (req, res) => {
  const { title, year, imdb, type, season, episode } = req.query
  if (!title) return res.status(400).json({ error: 'title required' })

  try {
    let query = title
    if (type === 'tv' && season) {
      const s = String(season).padStart(2, '0')
      const e = episode ? String(episode).padStart(2, '0') : null
      query = e ? `${title} S${s}E${e}` : `${title} S${s}`
    } else if (year) {
      query = `${title} ${year}`
    }

    const cat = type === 'tv' ? '205' : '207'
    const url = `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=${cat}`
    const upstream = await fetch(url, {
      agent: httpsAgent,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    })
    const data = await upstream.json()

    if (!Array.isArray(data) || data.length === 0 || data[0]?.name === 'No results returned') {
      // Fallback: broader search without category
      const url2 = `https://apibay.org/q.php?q=${encodeURIComponent(title + (year ? ' ' + year : ''))}&cat=0`
      const r2 = await fetch(url2, { agent: httpsAgent, headers: { 'User-Agent': 'Mozilla/5.0' } })
      const d2 = await r2.json()
      if (!Array.isArray(d2) || d2[0]?.name === 'No results returned') {
        return res.json({ results: [] })
      }
      const results = d2
        .filter(t => parseInt(t.seeders) > 0)
        .sort((a, b) => parseInt(b.seeders) - parseInt(a.seeders))
        .slice(0, 10)
        .map(t => ({
          name: t.name,
          quality: guessQuality(t.name),
          size: formatSize(t.size),
          seeders: parseInt(t.seeders),
          magnet: makeMagnet(t.info_hash, t.name),
        }))
      return res.json({ results })
    }

    const results = data
      .filter(t => parseInt(t.seeders) > 0)
      .sort((a, b) => parseInt(b.seeders) - parseInt(a.seeders))
      .slice(0, 12)
      .map(t => ({
        name: t.name,
        quality: guessQuality(t.name),
        size: formatSize(t.size),
        seeders: parseInt(t.seeders),
        magnet: makeMagnet(t.info_hash, t.name),
      }))

    res.json({ results })
  } catch (err) {
    res.status(502).json({ error: 'Download search failed', message: err.message })
  }
})

app.get('/proxy/moviebox-domain', async (req, res) => {
  try {
    const upstream = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/media-player/get-domain', {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'origin': 'https://moviebox.ph',
        'referer': 'https://moviebox.ph/',
        'Accept': 'application/json',
      },
    })
    const json = await upstream.json()
    res.json(json)
  } catch (err) {
    res.json({ code: 0, message: 'ok', data: 'https://123movienow.cc' })
  }
})

const PROXY_ROUTES = [
  {
    prefix: '/proxy/omdb',
    target: 'https://www.omdbapi.com',
    rewrite: (p) => p.replace(/^\/proxy\/omdb/, ''),
  },
  {
    prefix: '/proxy/tvmaze',
    target: 'https://api.tvmaze.com',
    rewrite: (p) => p.replace(/^\/proxy\/tvmaze/, ''),
  },
  {
    prefix: '/proxy/jikan',
    target: 'https://api.jikan.moe/v4',
    rewrite: (p) => p.replace(/^\/proxy\/jikan/, ''),
  },
  {
    prefix: '/proxy/scorebat',
    target: 'https://www.scorebat.com/video-api/v1',
    rewrite: (p) => p.replace(/^\/proxy\/scorebat/, ''),
  },
]

PROXY_ROUTES.forEach(({ prefix, target, rewrite }) => {
  app.use(prefix, async (req, res) => {
    const path = rewrite(req.path)
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const url = `${target}${path}${qs}`
    try {
      const upstream = await fetch(url, {
        agent: httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      })
      const ct = upstream.headers.get('content-type') || 'application/json'
      res.set('Content-Type', ct)
      res.set('Access-Control-Allow-Origin', '*')
      const text = await upstream.text()
      res.send(text)
    } catch (err) {
      res.status(502).json({ error: `Proxy error for ${prefix}`, message: err.message })
    }
  })
})

// ── ShowMax proxy (strips X-Frame-Options so it embeds in-site) ──
app.use('/proxy/showmax', async (req, res) => {
  const subPath = req.path === '/' ? '' : req.path
  const qs = Object.keys(req.query).length ? '?' + new URLSearchParams(req.query).toString() : ''
  const targetUrl = `https://showmax.com${subPath}${qs}`
  try {
    const upstream = await fetch(targetUrl, {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': req.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Referer': 'https://showmax.com/',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    })
    const contentType = upstream.headers.get('content-type') || 'text/html'
    // Forward all headers except the ones that block embedding
    upstream.headers.forEach((value, key) => {
      const skip = ['x-frame-options', 'content-security-policy', 'transfer-encoding', 'connection']
      if (!skip.includes(key.toLowerCase())) res.setHeader(key, value)
    })
    res.setHeader('Content-Type', contentType)
    // Stream the body through
    const buf = Buffer.from(await upstream.arrayBuffer())
    let body = buf.toString('utf8')
    // Rewrite absolute showmax.com URLs to use our proxy
    if (contentType.includes('html')) {
      body = body
        .replace(/https:\/\/showmax\.com\//g, '/proxy/showmax/')
        .replace(/(href|src|action)="\/(?!\/)/g, '$1="/proxy/showmax/')
    }
    res.send(body)
  } catch (e) {
    res.status(502).send(`<h3 style="color:#fff;font-family:sans-serif;padding:20px">ShowMax proxy error: ${e.message}</h3>`)
  }
})

// ── CricFy TV full-site proxy ────────────────────────────────────
// Serves any cricfy.tv page through our server, strips X-Frame-Options
// so the player embeds directly inside Ignatius Stream.
app.use('/proxy/cricfy', async (req, res) => {
  const subPath = req.path === '/' ? '/football-streams' : req.path
  const qs = Object.keys(req.query).length
    ? '?' + new URLSearchParams(req.query).toString()
    : ''
  const targetUrl = `https://cricfy.tv${subPath}${qs}`

  try {
    const upstream = await fetch(targetUrl, {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Referer': 'https://cricfy.tv/',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    })

    const contentType = upstream.headers.get('content-type') || 'text/html'

    // Forward safe headers, drop anything that blocks framing or sets cookies
    upstream.headers.forEach((value, key) => {
      const drop = ['x-frame-options', 'content-security-policy', 'transfer-encoding',
                    'connection', 'set-cookie', 'strict-transport-security']
      if (!drop.includes(key.toLowerCase())) res.setHeader(key, value)
    })
    res.setHeader('Content-Type', contentType)
    res.setHeader('Access-Control-Allow-Origin', '*')

    const buf = Buffer.from(await upstream.arrayBuffer())

    if (contentType.includes('html')) {
      let body = buf.toString('utf8')
      // Rewrite absolute + root-relative URLs so all navigation stays in-proxy
      body = body
        .replace(/https:\/\/cricfy\.tv\//g, '/proxy/cricfy/')
        .replace(/(href|src|action)="\/((?!proxy\/cricfy)[^"])/g, '$1="/proxy/cricfy/$2')
        // Inject base tag so relative resources load correctly
        .replace(/<head([^>]*)>/i, '<head$1><base href="https://cricfy.tv/">')
      res.send(body)
    } else {
      res.send(buf)
    }
  } catch (e) {
    res.status(502).send(
      `<div style="color:#fff;font-family:sans-serif;padding:32px;text-align:center;">
        <h2>⚽ Stream Unavailable</h2>
        <p style="color:#aaa">${e.message}</p>
        <a href="https://cricfy.tv/football-streams" target="_blank"
           style="color:#e50914">Open CricFy TV directly ↗</a>
       </div>`
    )
  }
})

// ── CricFy TV match list parser ──────────────────────────────────
// Returns live/upcoming football matches scraped from cricfy.tv
let _cricfyCache = null
let _cricfyCacheAt = 0
const CRICFY_TTL = 2 * 60 * 1000 // 2-minute cache

app.get('/api/cricfy-streams', async (req, res) => {
  if (_cricfyCache && Date.now() - _cricfyCacheAt < CRICFY_TTL) {
    return res.json(_cricfyCache)
  }
  try {
    const upstream = await fetch('https://cricfy.tv/football-streams', {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://cricfy.tv/',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })
    const html = await upstream.text()

    const matches = []
    const seen = new Set()

    // Strategy 1: anchor tags containing "vs" or "stream" in href/text
    const anchorRe = /<a[^>]+href="([^"]*(?:stream|match|watch|football|live|vs)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    let m
    while ((m = anchorRe.exec(html)) !== null) {
      const href = m[1]
      const inner = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (!inner || inner.length < 4 || inner.length > 120) continue
      if (seen.has(href)) continue
      seen.add(href)
      const proxyUrl = href.startsWith('http')
        ? '/proxy/cricfy/' + href.replace(/^https?:\/\/cricfy\.tv\//, '')
        : '/proxy/cricfy' + (href.startsWith('/') ? href : '/' + href)
      matches.push({ title: inner, proxyUrl, originalUrl: href })
    }

    // Strategy 2: generic links with football-like text
    if (matches.length === 0) {
      const linkRe = /<a[^>]+href="(\/[^"]+)"[^>]*>([^<]{5,80})<\/a>/gi
      while ((m = linkRe.exec(html)) !== null) {
        const href = m[1]
        const text = m[2].trim()
        if (seen.has(href)) continue
        if (!/vs|live|match|stream|fc |united|city|real |sport/i.test(text + href)) continue
        seen.add(href)
        matches.push({
          title: text,
          proxyUrl: '/proxy/cricfy' + href,
          originalUrl: href,
        })
      }
    }

    const result = { matches: matches.slice(0, 30), fetchedAt: Date.now() }
    _cricfyCache = result
    _cricfyCacheAt = Date.now()
    res.set('Access-Control-Allow-Origin', '*')
    res.json(result)
  } catch (e) {
    res.status(502).json({ error: e.message, matches: [] })
  }
})

// ── YouTube Live Video ID resolver ──────────────────────────────
app.get('/api/yt-live', async (req, res) => {
  const { channel } = req.query
  if (!channel) return res.json({ videoId: null, live: false })
  try {
    const r = await fetch(`https://www.youtube.com/channel/${channel}/live`, {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    const html = await r.text()
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
    const isLive = html.includes('"isLive":true') || html.includes('isLiveBroadcast') || html.includes('"liveBroadcastDetails"')
    if (videoIdMatch && isLive) {
      return res.json({ videoId: videoIdMatch[1], live: true })
    }
    // Try a second match for ongoing stream even without explicit isLive flag
    const canonical = html.match(/canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/)
    if (canonical) {
      return res.json({ videoId: canonical[1], live: true })
    }
    return res.json({ videoId: null, live: false })
  } catch (e) {
    return res.json({ videoId: null, live: false, error: e.message })
  }
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Stream proxy server running on port ${PORT}`)
  })
}

export default app
