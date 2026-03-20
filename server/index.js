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

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Stream proxy server running on port ${PORT}`)
  })
}

export default app
