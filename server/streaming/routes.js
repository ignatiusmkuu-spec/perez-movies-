/**
 * Streaming REST API — all endpoints
 *
 * Movie management:
 *   POST   /api/movies                  — create movie
 *   GET    /api/movies                  — list movies (with filters)
 *   GET    /api/movies/:id              — get movie + sources
 *   PUT    /api/movies/:id              — update movie metadata
 *   DELETE /api/movies/:id              — delete movie
 *
 * Source management:
 *   POST   /api/movies/:id/sources      — add a streaming source
 *   GET    /api/movies/:id/sources      — list sources
 *   DELETE /api/movies/:id/sources/:sid — remove source
 *
 * Stream tokens & playback:
 *   POST   /api/stream/token            — generate expiring stream token
 *   GET    /api/stream/play/:token      — resolve token → stream URL
 *   GET    /api/stream/manifest/:id     — full HLS/DASH/RTMP/WebRTC manifest
 *
 * Server management:
 *   GET    /api/stream/servers          — list all servers + health
 *   GET    /api/stream/health           — run health check now
 *   POST   /api/stream/failover         — manually trigger failover
 *
 * Encoding:
 *   GET    /api/encode/pipeline/:id     — get FFmpeg commands for movie
 *   POST   /api/movies/:id/poster       — upload poster image
 */

import { Router } from 'express'
import multer from 'multer'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'

import {
  listMovies, getMovie, createMovie, updateMovie, deleteMovie,
  addSource, listSources, removeSource,
} from './db.js'

import {
  signStreamToken, verifyStreamToken, buildStreamUrl, extractClientIp,
} from './token.js'

import {
  runHealthChecks, triggerFailover, getServerStatus, buildStreamManifest, pickServer,
} from './servers.js'

import {
  getEncodingPipeline, QUALITY_PRESETS,
} from './ffmpeg.js'

const __dir = dirname(fileURLToPath(import.meta.url))

/* ── File upload config ── */
const UPLOAD_DIR = join(__dir, '..', '..', 'public', 'uploads')
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB poster limit
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed for posters'))
    }
    cb(null, true)
  },
})

const router = Router()

/* ── Helpers ── */
function ok(res, data, status = 200)  { res.status(status).json({ success: true,  data }) }
function err(res, msg, status = 400)  { res.status(status).json({ success: false, error: msg }) }

/* ════════════════════════════════════════════════════════════
   MOVIE CRUD
   ════════════════════════════════════════════════════════════ */

/* POST /api/movies */
router.post('/movies', (req, res) => {
  const { title } = req.body
  if (!title) return err(res, 'title is required')
  try {
    const movie = createMovie(req.body)
    ok(res, movie, 201)
  } catch (e) {
    err(res, e.message, 500)
  }
})

/* GET /api/movies */
router.get('/movies', (req, res) => {
  const { genre, year, q, search, limit = 50, offset = 0 } = req.query
  const movies = listMovies({ genre, year, search: q || search })
  const slice  = movies.slice(Number(offset), Number(offset) + Number(limit))
  ok(res, { movies: slice, total: movies.length, limit: Number(limit), offset: Number(offset) })
})

/* GET /api/movies/:id */
router.get('/movies/:id', (req, res) => {
  const movie = getMovie(req.params.id)
  if (!movie) return err(res, 'Movie not found', 404)
  ok(res, movie)
})

/* PUT /api/movies/:id */
router.put('/movies/:id', (req, res) => {
  const movie = updateMovie(req.params.id, req.body)
  if (!movie) return err(res, 'Movie not found', 404)
  ok(res, movie)
})

/* DELETE /api/movies/:id */
router.delete('/movies/:id', (req, res) => {
  const deleted = deleteMovie(req.params.id)
  if (!deleted) return err(res, 'Movie not found', 404)
  ok(res, { deleted: true })
})

/* ════════════════════════════════════════════════════════════
   STREAMING SOURCES
   ════════════════════════════════════════════════════════════ */

/* POST /api/movies/:id/sources */
router.post('/movies/:id/sources', (req, res) => {
  const { url } = req.body
  if (!url) return err(res, 'url is required')
  const source = addSource(req.params.id, req.body)
  if (!source) return err(res, 'Movie not found', 404)
  ok(res, source, 201)
})

/* GET /api/movies/:id/sources */
router.get('/movies/:id/sources', (req, res) => {
  const sources = listSources(req.params.id)
  ok(res, sources)
})

/* DELETE /api/movies/:id/sources/:sid */
router.delete('/movies/:id/sources/:sid', (req, res) => {
  const deleted = removeSource(req.params.id, req.params.sid)
  if (!deleted) return err(res, 'Source not found', 404)
  ok(res, { deleted: true })
})

/* ════════════════════════════════════════════════════════════
   POSTER UPLOAD
   ════════════════════════════════════════════════════════════ */

/* POST /api/movies/:id/poster */
router.post('/movies/:id/poster', upload.single('poster'), (req, res) => {
  if (!req.file) return err(res, 'No poster file uploaded')
  const movie = getMovie(req.params.id)
  if (!movie) return err(res, 'Movie not found', 404)

  const publicUrl = `/uploads/${req.file.filename}`
  updateMovie(req.params.id, { poster: publicUrl })
  ok(res, { poster: publicUrl })
})

/* ════════════════════════════════════════════════════════════
   STREAM TOKENS & PLAYBACK
   ════════════════════════════════════════════════════════════ */

/* POST /api/stream/token  — generate an expiring stream token */
router.post('/stream/token', (req, res) => {
  const { movieId, quality = 'auto', protocol = 'hls', bindIp = false, ttl } = req.body
  if (!movieId) return err(res, 'movieId is required')

  const movie = getMovie(movieId)
  if (!movie) return err(res, 'Movie not found', 404)

  const clientIp = bindIp ? extractClientIp(req) : null
  const server   = pickServer(protocol)
  if (!server)   return err(res, 'No streaming server available', 503)

  const { token, jti, expiresIn } = signStreamToken({
    movieId, quality, protocol, clientIp,
    ttl: ttl ? Number(ttl) : undefined,
  })

  const streamUrl = buildStreamUrl(
    `${server.baseUrl}/movies/${movieId}`,
    token, { quality, protocol }
  )

  ok(res, {
    token,
    jti,
    expiresIn,
    streamUrl,
    server: server.name,
    protocol,
    quality,
  })
})

/* GET /api/stream/play/:token  — validate token and return real stream URL */
router.get('/stream/play/:token', (req, res) => {
  const clientIp = extractClientIp(req)
  const result   = verifyStreamToken(req.params.token, clientIp)

  if (!result.valid) {
    return err(res, `Stream access denied: ${result.reason}`, 403)
  }

  const { payload } = result
  const movie = getMovie(payload.sub)
  if (!movie) return err(res, 'Movie not found', 404)

  const server = pickServer(payload.p || 'hls')
  if (!server)  return err(res, 'No streaming server available', 503)

  const streamUrl = buildStreamUrl(
    `${server.baseUrl}/movies/${payload.sub}`,
    req.params.token,
    { quality: payload.q, protocol: payload.p }
  )

  ok(res, {
    streamUrl,
    protocol: payload.p,
    quality:  payload.q,
    movie: {
      id:    movie.id,
      title: movie.title,
      year:  movie.year,
    },
    server: server.name,
  })
})

/* GET /api/stream/manifest/:id — full manifest for all protocols + qualities */
router.get('/stream/manifest/:id', (req, res) => {
  const movie = getMovie(req.params.id)
  if (!movie) return err(res, 'Movie not found', 404)

  const clientIp = extractClientIp(req)

  const tokenFactory = ({ movieId, quality, protocol }) => {
    return signStreamToken({ movieId, quality, protocol, clientIp })
  }

  const manifest = buildStreamManifest(req.params.id, movie.sources || [], tokenFactory)

  ok(res, {
    movieId: movie.id,
    title:   movie.title,
    poster:  movie.poster,
    streams: manifest,
    qualities: Object.keys(QUALITY_PRESETS),
    protocols: ['hls', 'dash', 'rtmp', 'webrtc'],
  })
})

/* ════════════════════════════════════════════════════════════
   SERVER MANAGEMENT
   ════════════════════════════════════════════════════════════ */

/* GET /api/stream/servers */
router.get('/stream/servers', async (req, res) => {
  ok(res, await getServerStatus())
})

/* GET /api/stream/health */
router.get('/stream/health', async (req, res) => {
  const results = await runHealthChecks()
  const allHealthy = results.every(r => r.healthy)
  res.status(allHealthy ? 200 : 207).json({
    success: true,
    allHealthy,
    servers: results,
    checkedAt: new Date().toISOString(),
  })
})

/* POST /api/stream/failover */
router.post('/stream/failover', (req, res) => {
  const { fromServerId } = req.body
  if (!fromServerId) return err(res, 'fromServerId is required')
  const next = triggerFailover(fromServerId)
  if (!next) return err(res, 'No backup server available', 503)
  ok(res, { failedOver: true, newServer: next })
})

/* ════════════════════════════════════════════════════════════
   ENCODING PIPELINE (FFmpeg commands)
   ════════════════════════════════════════════════════════════ */

/* GET /api/encode/pipeline/:id */
router.get('/encode/pipeline/:id', (req, res) => {
  const movie = getMovie(req.params.id)
  if (!movie) return err(res, 'Movie not found', 404)

  const inputFile  = req.query.input  || `/uploads/${movie.id}/original.mp4`
  const outputDir  = req.query.output || `/streams`

  const pipeline = getEncodingPipeline(inputFile, outputDir, movie.id)

  ok(res, {
    movieId: movie.id,
    title:   movie.title,
    pipeline,
    qualities: QUALITY_PRESETS,
    note: 'Run these commands on your media server with FFmpeg installed.',
  })
})

/* ════════════════════════════════════════════════════════════
   CDN URL GENERATION
   ════════════════════════════════════════════════════════════ */

/* GET /api/cdn/url/:id */
router.get('/cdn/url/:id', (req, res) => {
  const { quality = 'auto', protocol = 'hls' } = req.query
  const movie = getMovie(req.params.id)
  if (!movie) return err(res, 'Movie not found', 404)

  const CDN_BASE = process.env.CDN_BASE_URL || 'https://cdn.example.com'
  const source = (movie.sources || []).find(s =>
    s.protocol === protocol && s.quality === quality
  )

  const cdnUrl = source?.cdnUrl || `${CDN_BASE}/movies/${movie.id}/${quality}/playlist.m3u8`

  ok(res, {
    movieId:  movie.id,
    protocol,
    quality,
    cdnUrl,
    cdnBase:  CDN_BASE,
  })
})

export default router
