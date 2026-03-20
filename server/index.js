import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import fetch from 'node-fetch'
import https from 'https'
import http from 'http'

const app = express()
const PORT = 3001

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

app.use('/stream-proxy', async (req, res) => {
  const target = req.query.target
  if (!target) return res.status(400).send('Missing target URL')

  try {
    const parsedUrl = new URL(target)
    const isHttps = parsedUrl.protocol === 'https:'
    const agent = isHttps ? httpsAgent : undefined

    const upstream = await fetch(target, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': parsedUrl.origin,
      },
      redirect: 'follow',
    })

    const contentType = upstream.headers.get('content-type') || 'text/html'
    res.set('Content-Type', contentType)
    res.set('Access-Control-Allow-Origin', '*')
    res.removeHeader('X-Frame-Options')
    res.removeHeader('Content-Security-Policy')

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

app.listen(PORT, () => {
  console.log(`Stream proxy server running on port ${PORT}`)
})
