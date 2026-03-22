import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import https from 'https'
import ytsr from 'ytsr'

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
    (imdb) => `https://vsys.kora-top.zip/frame.php?ch=${imdb}&p=12`,
    (imdb) => `https://ar.kora-top.zip/frame.php?ch=${imdb}&p=12`,
    (imdb) => `https://live.kora-top.zip/frame.php?ch=${imdb}&p=12`,
    (imdb) => `https://xprime.tv/embed/${imdb}`,
    (imdb) => `https://vidsrc.me/embed/movie/${imdb}`,
    (imdb) => `https://multiembed.mov/?video_id=${imdb}&tmdb=1`,
    (imdb) => `https://vidlink.pro/movie/${imdb}`,
    (imdb) => `https://pstream.mov/embed/movie/${imdb}`,
    (imdb) => `https://flixer.su/embed/${imdb}`,
  ],
  tv: [
    (imdb, s, e) => `https://moviesapi.to/tv/${imdb}-${s}-${e}`,
    (imdb, s, e) => `https://www.2embed.cc/embedtv/${imdb}&s=${s}&e=${e}`,
    (imdb, s, e) => `https://vidsrc.xyz/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
    (imdb, s, e) => `https://vsys.kora-top.zip/frame.php?ch=${imdb}&p=12`,
    (imdb, s, e) => `https://live.kora-top.zip/frame.php?ch=${imdb}&p=12`,
    (imdb, s, e) => `https://xprime.tv/embed/tv/${imdb}?season=${s}&episode=${e}`,
    (imdb, s, e) => `https://vidsrc.me/embed/tv/${imdb}/${s}/${e}`,
    (imdb, s, e) => `https://multiembed.mov/?video_id=${imdb}&tmdb=1&s=${s}&e=${e}`,
    (imdb, s, e) => `https://vidlink.pro/tv/${imdb}/${s}/${e}`,
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
    const DROP = new Set(['x-frame-options','content-security-policy','transfer-encoding','connection'])
    upstream.headers.forEach((v, k) => { if (!DROP.has(k.toLowerCase())) res.setHeader(k, v) })
    res.set('Content-Type', contentType)
    res.set('Access-Control-Allow-Origin', '*')

    const body = await upstream.text()
    const baseUrl = upstream.url || target
    const baseOrigin = new URL(baseUrl).origin

    const patched = body
      .replace(/<head([^>]*)>/i, `<head$1><base href="${baseOrigin}/">`)
      .replace(/<meta[^>]*(?:x-frame-options|content-security-policy)[^>]*>/gi, '')

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

async function searchApibay(query, cat) {
  try {
    const url = `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=${cat}`
    const r = await fetch(url, {
      agent: httpsAgent,
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    })
    const data = await r.json()
    if (!Array.isArray(data) || data[0]?.name === 'No results returned') return []
    return data.filter(t => parseInt(t.seeders) > 0)
  } catch { return [] }
}

async function searchYts(query, imdb) {
  try {
    const param = imdb ? `imdb_id=${encodeURIComponent(imdb)}` : `query_term=${encodeURIComponent(query)}`
    const url = `https://yts.mx/api/v2/list_movies.json?${param}&limit=10`
    const r = await fetch(url, {
      agent: httpsAgent,
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    })
    const json = await r.json()
    const movies = json?.data?.movies || []
    const results = []
    for (const movie of movies) {
      for (const torrent of (movie.torrents || [])) {
        const name = `${movie.title} (${movie.year}) [${torrent.quality}]`
        results.push({
          name,
          quality: torrent.quality === '2160p' ? '4K' : torrent.quality,
          size: torrent.size || '?',
          seeders: torrent.seeds || 0,
          magnet: makeMagnet(torrent.hash, name),
        })
      }
    }
    return results.filter(r => r.seeders > 0)
  } catch { return [] }
}

app.get('/api/download', async (req, res) => {
  const { title, year, imdb, type, season, episode } = req.query
  if (!title) return res.status(400).json({ error: 'title required' })

  try {
    const isMovie = type !== 'tv'
    let query = title
    if (!isMovie && season) {
      const s = String(season).padStart(2, '0')
      const e = episode ? String(episode).padStart(2, '0') : null
      query = e ? `${title} S${s}E${e}` : `${title} S${s}`
    } else if (year) {
      query = `${title} ${year}`
    }

    const cat = isMovie ? '207' : '205'

    // Run searches in parallel: apibay (targeted) + apibay (broad) + YTS for movies
    const [apibayResults, ytsResults] = await Promise.all([
      searchApibay(query, cat).then(r => r.length ? r : searchApibay(title + (year ? ' ' + year : ''), '0')),
      isMovie ? searchYts(title + (year ? ' ' + year : ''), imdb) : Promise.resolve([]),
    ])

    // Merge and deduplicate by name
    const seen = new Set()
    const merged = []
    for (const t of apibayResults) {
      const item = {
        name: t.name,
        quality: guessQuality(t.name),
        size: formatSize(t.size),
        seeders: parseInt(t.seeders),
        magnet: makeMagnet(t.info_hash, t.name),
      }
      if (!seen.has(item.name)) { seen.add(item.name); merged.push(item) }
    }
    for (const t of ytsResults) {
      if (!seen.has(t.name)) { seen.add(t.name); merged.push(t) }
    }

    const results = merged
      .sort((a, b) => b.seeders - a.seeders)
      .slice(0, 15)

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
// Comprehensive proxy: rewrites HTML attrs, CSS url(), JS strings,
// and passes binaries through unchanged. Strips all frame-blocking headers.

const CRICFY_ORIGIN = 'https://cricfy.tv'
const PROXY_PREFIX  = '/proxy/cricfy'

// Rewrite any URL that belongs to cricfy.tv into our proxy path
function rewriteUrl(url) {
  if (!url) return url
  // Already proxied
  if (url.startsWith(PROXY_PREFIX)) return url
  // Absolute cricfy.tv URL
  if (url.startsWith(CRICFY_ORIGIN)) {
    return PROXY_PREFIX + url.slice(CRICFY_ORIGIN.length)
  }
  // Protocol-relative
  if (url.startsWith('//cricfy.tv')) {
    return PROXY_PREFIX + url.slice('//cricfy.tv'.length)
  }
  // Root-relative (starts with /)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return PROXY_PREFIX + url
  }
  return url
}

// Rewrite all URLs in an HTML string
function rewriteHtml(html) {
  return html
    // Absolute cricfy.tv URLs anywhere in text/attrs
    .replace(/https?:\/\/cricfy\.tv\//g, PROXY_PREFIX + '/')
    // protocol-relative
    .replace(/\/\/cricfy\.tv\//g, PROXY_PREFIX + '/')
    // href/src/action/data-src/srcset attributes with root-relative paths
    .replace(/((?:href|src|action|data-src|data-href|data-url|content)=["'])\/(?!\/|proxy\/cricfy)/g,
             `$1${PROXY_PREFIX}/`)
    // srcset (multiple URLs separated by commas)
    .replace(/srcset="([^"]+)"/g, (_, srcs) => {
      const rewritten = srcs.replace(/(https?:\/\/cricfy\.tv)?(\S+\.(webp|jpg|jpeg|png|gif|avif))/g,
        (m, origin, path) => origin ? `${PROXY_PREFIX}${path}` : m)
      return `srcset="${rewritten}"`
    })
    // window.location / location.href assignments targeting cricfy.tv
    .replace(/(['"`])https?:\/\/cricfy\.tv\/([^'"`]*)\1/g,
             (_, q, p) => `${q}${PROXY_PREFIX}/${p}${q}`)
    // Remove X-Frame / CSP meta tags
    .replace(/<meta[^>]+(?:x-frame-options|content-security-policy)[^>]*>/gi, '')
    // Inject script to intercept in-page navigation so it stays proxied
    .replace('</head>',
      `<script>
       (function(){
         var _push = history.pushState.bind(history);
         var _replace = history.replaceState.bind(history);
         function fix(u){ if(!u) return u;
           if(typeof u==='string' && u.startsWith('https://cricfy.tv'))
             return '${PROXY_PREFIX}' + u.slice('https://cricfy.tv'.length);
           return u; }
         history.pushState   = function(s,t,u){ _push(s,t,fix(u)); };
         history.replaceState= function(s,t,u){ _replace(s,t,fix(u)); };
         var _open = XMLHttpRequest.prototype.open;
         XMLHttpRequest.prototype.open = function(m,u){ arguments[1]=fix(u)||u; _open.apply(this,arguments); };
         var _fetch = window.fetch;
         window.fetch = function(u,o){ return _fetch(typeof u==='string'?fix(u):u,o); };
       })();
      </script></head>`)
}

// Rewrite URLs inside CSS files
function rewriteCss(css) {
  return css
    .replace(/url\(\s*['"]?(https?:\/\/cricfy\.tv)?\/([^'")]+)['"]?\s*\)/g,
             (_, origin, path) => `url(${PROXY_PREFIX}/${path})`)
    .replace(/https?:\/\/cricfy\.tv\//g, PROXY_PREFIX + '/')
}

// Rewrite string literals inside JS files
function rewriteJs(js) {
  return js
    .replace(/(['"`])https?:\/\/cricfy\.tv\/([^'"`]*)\1/g,
             (_, q, p) => `${q}${PROXY_PREFIX}/${p}${q}`)
}

app.use('/proxy/cricfy', async (req, res) => {
  const subPath = req.path === '/' ? '/' : req.path
  const qs = Object.keys(req.query).length
    ? '?' + new URLSearchParams(req.query).toString()
    : ''
  const targetUrl = `${CRICFY_ORIGIN}${subPath}${qs}`

  try {
    const upstream = await fetch(targetUrl, {
      agent: httpsAgent,
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          req.headers['accept'] || '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Referer':         CRICFY_ORIGIN + '/',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })

    const ct = (upstream.headers.get('content-type') || 'application/octet-stream').toLowerCase()

    // Strip framing/security headers; pass the rest
    const DROP = new Set(['x-frame-options','content-security-policy','transfer-encoding',
                          'connection','set-cookie','strict-transport-security','content-encoding'])
    upstream.headers.forEach((v, k) => { if (!DROP.has(k)) res.setHeader(k, v) })
    res.setHeader('Content-Type', ct)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=30')

    const isText = ct.includes('html') || ct.includes('css') ||
                   ct.includes('javascript') || ct.includes('json') || ct.includes('xml')

    if (isText) {
      const text = await upstream.text()
      if (ct.includes('html'))       return res.send(rewriteHtml(text))
      if (ct.includes('css'))        return res.send(rewriteCss(text))
      if (ct.includes('javascript')) return res.send(rewriteJs(text))
      return res.send(text)
    } else {
      // Binary: images, fonts, video segments, etc. — stream directly
      const buf = Buffer.from(await upstream.arrayBuffer())
      res.send(buf)
    }
  } catch (e) {
    const isHtml = (req.headers['accept'] || '').includes('html')
    if (isHtml) {
      res.status(502).send(
        `<!DOCTYPE html><html><body style="background:#0a0a0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px">
          <div style="font-size:3rem">⚽</div>
          <h2 style="margin:0">Stream Unavailable</h2>
          <p style="color:#888;margin:0">${e.message}</p>
          <a href="${CRICFY_ORIGIN}" target="_blank"
             style="background:#e50914;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700">
            Open CricFy TV ↗
          </a>
        </body></html>`
      )
    } else {
      res.status(502).end()
    }
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

// ── Koora Live — Matches & Channels (koora-lives.space) ─────────────────────

const KOORA_MATCHES_API = 'https://ws.kora-api.space/'
const KOORA_MATCH_API   = 'https://ws.kora-api.top/'
const KOORA_CDN         = 'https://cdn.kora-api.space/'

let _kooraMatchesCache = {}
const KOORA_TTL = 90 * 1000

function getTodayDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

app.get('/api/koora/matches', async (req, res) => {
  const date = req.query.date || getTodayDate()
  if (_kooraMatchesCache[date] && Date.now() - _kooraMatchesCache[date].at < KOORA_TTL) {
    return res.json(_kooraMatchesCache[date].data)
  }
  try {
    const url = `${KOORA_MATCHES_API}api/matches/${date}/1?t=${Date.now()}`
    const upstream = await fetch(url, {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://koora-lives.space/',
        'Origin':  'https://koora-lives.space',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!upstream.ok) return res.status(upstream.status).json({ matches: [], error: 'Upstream error' })
    const data = await upstream.json()
    _kooraMatchesCache[date] = { at: Date.now(), data }
    res.set('Access-Control-Allow-Origin', '*')
    res.json(data)
  } catch (e) {
    res.status(502).json({ matches: [], error: e.message })
  }
})

let _kooraMatchDetailCache = {}
const KOORA_DETAIL_TTL = 60 * 1000

app.get('/api/koora/match/:id', async (req, res) => {
  const { id } = req.params
  if (_kooraMatchDetailCache[id] && Date.now() - _kooraMatchDetailCache[id].at < KOORA_DETAIL_TTL) {
    return res.json(_kooraMatchDetailCache[id].data)
  }
  try {
    const url = `${KOORA_MATCH_API}api/matche/${id}/en?t=${Date.now()}`
    const upstream = await fetch(url, {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://xyzkoora-lives-space.smartagro.mov/',
        'Origin':  'https://xyzkoora-lives-space.smartagro.mov',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    })
    if (!upstream.ok) return res.status(upstream.status).json({ channels: [], error: 'Upstream error' })
    const data = await upstream.json()
    _kooraMatchDetailCache[id] = { at: Date.now(), data }
    res.set('Access-Control-Allow-Origin', '*')
    res.json(data)
  } catch (e) {
    res.status(502).json({ channels: [], error: e.message })
  }
})

app.use('/proxy/koora-cdn', async (req, res) => {
  const targetUrl = KOORA_CDN + req.path.replace(/^\//, '') + (Object.keys(req.query).length ? '?' + new URLSearchParams(req.query) : '')
  try {
    const upstream = await fetch(targetUrl, {
      agent: httpsAgent,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://koora-lives.space/' },
      signal: AbortSignal.timeout(10000),
    })
    const ct = upstream.headers.get('content-type') || 'application/octet-stream'
    res.setHeader('Content-Type', ct)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.send(buf)
  } catch (e) {
    res.status(502).end()
  }
})

app.use('/proxy/koora-stream', async (req, res) => {
  const rawTarget = req.query.url
  if (!rawTarget) return res.status(400).send('Missing ?url=')
  try {
    const targetUrl = decodeURIComponent(rawTarget)
    const upstream = await fetch(targetUrl, {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://koora-lives.space/',
        'Origin':  'https://koora-lives.space',
        'Accept':  '*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    const ct = (upstream.headers.get('content-type') || 'text/html').toLowerCase()
    const DROP = new Set(['x-frame-options','content-security-policy','transfer-encoding','connection','strict-transport-security'])
    upstream.headers.forEach((v, k) => { if (!DROP.has(k)) res.setHeader(k, v) })
    res.setHeader('Content-Type', ct)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.send(buf)
  } catch (e) {
    res.status(502).send('Proxy error: ' + e.message)
  }
})

// ──────────────────────────────────────────────────────────────────────────────
// YouTube — Invidious (trending) + ytsr (search/channel)
// ──────────────────────────────────────────────────────────────────────────────

const INVIDIOUS_INSTANCES = [
  'https://iv.melmac.space',
]

const YT_CAT_MAP = {
  trending: 'Default',
  music:    'Music',
  gaming:   'Gaming',
  movies:   'Movies',
  news:     'News',
  sports:   'Sports',
}

// Category → search query fallback (used when Invidious is down)
const YT_CAT_QUERY = {
  trending: 'trending videos 2025',
  music:    'top music hits 2025',
  gaming:   'gaming videos 2025',
  movies:   'movie trailers 2025',
  news:     'world news today 2025',
  sports:   'sports highlights 2025',
}

const _ytCache = {}
const YT_TTL = 5 * 60 * 1000

function mapInvVideo(v) {
  if (!v || !v.videoId) return null
  const thumb = `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
  const secs = v.lengthSeconds || 0
  const duration = secs ? `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}` : (v.liveNow ? 'LIVE' : '')
  const views = v.viewCount ? Number(v.viewCount).toLocaleString() + ' views' : ''
  return {
    vid: v.videoId,
    title: v.title || '',
    channel: v.author || '',
    channelId: v.authorId || '',
    views,
    duration,
    published: v.publishedText || '',
    thumb,
    isLive: !!(v.liveNow),
  }
}

function mapYtsrVideo(v) {
  if (!v || v.type !== 'video' || !v.id) return null
  const thumb = `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`
  const views = v.views ? Number(v.views).toLocaleString() + ' views' : ''
  return {
    vid: v.id,
    title: v.title || '',
    channel: v.author?.name || '',
    channelId: v.author?.channelID || '',
    views,
    duration: v.duration || '',
    published: v.uploadedAt || '',
    thumb,
    isLive: !!(v.isLive),
  }
}

async function invidiousFetch(path) {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const r = await fetch(`${base}${path}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'IgnatiusStream/1.0' },
        signal: AbortSignal.timeout(8000),
      })
      if (!r.ok) continue
      const data = await r.json()
      if (data && (Array.isArray(data) ? data.length > 0 : true)) return data
    } catch { /* try next */ }
  }
  return null
}

async function ytsrSearch(query, limit = 50) {
  const origError = console.error
  console.error = () => {}
  try {
    let res
    try {
      const filters = await ytsr.getFilters(query)
      const filter  = filters.get('Type')?.get('Video')
      const url     = filter?.url || query
      res = await ytsr(url, { limit, safeSearch: false })
    } catch {
      res = await ytsr(query, { limit, safeSearch: false })
    }
    return (res.items || []).map(mapYtsrVideo).filter(Boolean)
  } finally {
    console.error = origError
  }
}

app.get('/api/youtube/trending', async (req, res) => {
  const cat = req.query.category || 'trending'
  const cacheKey = `trend_${cat}`
  if (_ytCache[cacheKey] && Date.now() - _ytCache[cacheKey].at < YT_TTL) {
    return res.json(_ytCache[cacheKey].data)
  }
  try {
    let videos = []
    if (cat === 'trending') {
      // Use Invidious for general trending, fallback to ytsr
      const invData = await invidiousFetch(`/api/v1/trending?region=US&type=Default`)
      if (invData && Array.isArray(invData) && invData.length > 0) {
        videos = invData.map(mapInvVideo).filter(Boolean).slice(0, 60)
      } else {
        videos = (await ytsrSearch('trending videos 2025', 50)).slice(0, 60)
      }
    } else {
      // Use ytsr for category-specific results (more accurate)
      videos = (await ytsrSearch(YT_CAT_QUERY[cat] || 'trending videos 2025', 50)).slice(0, 60)
    }
    const result = { videos, category: cat }
    _ytCache[cacheKey] = { at: Date.now(), data: result }
    res.json(result)
  } catch (e) {
    res.status(502).json({ videos: [], error: e.message })
  }
})

app.get('/api/youtube/search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json({ videos: [], query: '' })
  const cacheKey = `search_${q.toLowerCase()}`
  if (_ytCache[cacheKey] && Date.now() - _ytCache[cacheKey].at < YT_TTL) {
    return res.json(_ytCache[cacheKey].data)
  }
  try {
    const videos = (await ytsrSearch(q, 50)).slice(0, 60)
    const result = { videos, query: q }
    _ytCache[cacheKey] = { at: Date.now(), data: result }
    res.json(result)
  } catch (e) {
    res.status(502).json({ videos: [], error: e.message })
  }
})

app.get('/api/youtube/channel', async (req, res) => {
  const { id } = req.query
  if (!id) return res.json({ videos: [] })
  const cacheKey = `chan_${id}`
  if (_ytCache[cacheKey] && Date.now() - _ytCache[cacheKey].at < YT_TTL) {
    return res.json(_ytCache[cacheKey].data)
  }
  try {
    // Try Invidious first
    const invData = await invidiousFetch(`/api/v1/channels/${id}/videos`)
    let videos = []
    if (invData) {
      const list = Array.isArray(invData) ? invData : (invData.videos || [])
      videos = list.map(mapInvVideo).filter(Boolean).slice(0, 60)
    }
    const result = { videos, channelId: id }
    _ytCache[cacheKey] = { at: Date.now(), data: result }
    res.json(result)
  } catch (e) {
    res.status(502).json({ videos: [], error: e.message })
  }
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Stream proxy server running on port ${PORT}`)
  })
}

export default app
