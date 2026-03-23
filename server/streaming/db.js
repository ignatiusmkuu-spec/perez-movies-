/**
 * Lightweight JSON file store.
 * In production, swap this module's read/write functions with your preferred
 * database driver (PostgreSQL, MySQL, MongoDB) while keeping the same interface.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = join(__dir, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'streaming.json')

const DEFAULTS = {
  movies:  [],
  sources: [],
  tokens:  [],
  servers: [
    {
      id: 'primary',
      name: 'Primary HLS',
      protocol: 'hls',
      baseUrl: process.env.PRIMARY_STREAM_URL || 'https://stream1.example.com',
      active: true,
      priority: 1,
      healthUrl: '',
      lastCheck: null,
      healthy: true,
    },
    {
      id: 'backup1',
      name: 'Backup HLS',
      protocol: 'hls',
      baseUrl: process.env.BACKUP_STREAM_URL  || 'https://stream2.example.com',
      active: true,
      priority: 2,
      healthUrl: '',
      lastCheck: null,
      healthy: true,
    },
    {
      id: 'backup2',
      name: 'DASH CDN',
      protocol: 'dash',
      baseUrl: process.env.DASH_STREAM_URL    || 'https://dash.example.com',
      active: true,
      priority: 3,
      healthUrl: '',
      lastCheck: null,
      healthy: true,
    },
  ],
}

function ensure() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    if (!existsSync(DATA_FILE)) writeFileSync(DATA_FILE, JSON.stringify(DEFAULTS, null, 2))
  } catch { /* read-only filesystem (e.g. Vercel) — in-memory store only */ }
}

function read() {
  ensure()
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return { ...DEFAULTS }
  }
}

function write(data) {
  ensure()
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

/* ── Movies ── */
export function listMovies(filters = {}) {
  const db = read()
  let movies = db.movies
  if (filters.genre)  movies = movies.filter(m => m.genre?.toLowerCase().includes(filters.genre.toLowerCase()))
  if (filters.year)   movies = movies.filter(m => m.year == filters.year)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    movies = movies.filter(m => m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q))
  }
  return movies.map(m => enrichMovie(m, db))
}

export function getMovie(id) {
  const db = read()
  const movie = db.movies.find(m => m.id === id)
  if (!movie) return null
  return enrichMovie(movie, db)
}

function enrichMovie(movie, db) {
  const sources = db.sources.filter(s => s.movieId === movie.id)
  return { ...movie, sources }
}

export function createMovie(data) {
  const db = read()
  const movie = {
    id:          data.id || crypto.randomUUID(),
    title:       data.title,
    description: data.description || '',
    year:        data.year || null,
    genre:       data.genre || '',
    poster:      data.poster || '',
    imdbId:      data.imdbId || null,
    duration:    data.duration || null,
    language:    data.language || 'en',
    rating:      data.rating || null,
    cast:        data.cast || [],
    director:    data.director || '',
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  }
  db.movies.push(movie)
  write(db)
  return enrichMovie(movie, db)
}

export function updateMovie(id, data) {
  const db = read()
  const idx = db.movies.findIndex(m => m.id === id)
  if (idx === -1) return null
  db.movies[idx] = { ...db.movies[idx], ...data, updatedAt: new Date().toISOString() }
  write(db)
  return enrichMovie(db.movies[idx], db)
}

export function deleteMovie(id) {
  const db = read()
  const before = db.movies.length
  db.movies  = db.movies.filter(m => m.id !== id)
  db.sources = db.sources.filter(s => s.movieId !== id)
  write(db)
  return db.movies.length < before
}

/* ── Sources ── */
export function addSource(movieId, data) {
  const db = read()
  if (!db.movies.find(m => m.id === movieId)) return null

  const source = {
    id:        crypto.randomUUID(),
    movieId,
    serverId:  data.serverId  || 'primary',
    serverName: data.serverName || 'Primary',
    protocol:  data.protocol  || 'hls',
    quality:   data.quality   || 'auto',
    url:       data.url,
    cdnUrl:    data.cdnUrl    || data.url,
    isPrimary: !!data.isPrimary,
    isActive:  true,
    bitrate:   data.bitrate   || null,
    width:     data.width     || null,
    height:    data.height    || null,
    codec:     data.codec     || 'h264',
    createdAt: new Date().toISOString(),
  }
  db.sources.push(source)
  write(db)
  return source
}

export function listSources(movieId) {
  const db = read()
  return db.sources.filter(s => s.movieId === movieId)
}

export function removeSource(movieId, sourceId) {
  const db = read()
  const before = db.sources.length
  db.sources = db.sources.filter(s => !(s.movieId === movieId && s.id === sourceId))
  write(db)
  return db.sources.length < before
}

/* ── Tokens ── */
export function saveToken(tokenData) {
  const db = read()
  // Clean expired tokens
  db.tokens = db.tokens.filter(t => new Date(t.expiresAt) > new Date())
  db.tokens.push(tokenData)
  write(db)
}

export function getToken(jti) {
  const db = read()
  return db.tokens.find(t => t.jti === jti) || null
}

export function markTokenUsed(jti) {
  const db = read()
  const token = db.tokens.find(t => t.jti === jti)
  if (token) {
    token.usedAt = new Date().toISOString()
    token.useCount = (token.useCount || 0) + 1
    write(db)
  }
}

/* ── Servers ── */
export function listServers() {
  return read().servers
}

export function updateServer(id, data) {
  const db = read()
  const idx = db.servers.findIndex(s => s.id === id)
  if (idx === -1) return null
  db.servers[idx] = { ...db.servers[idx], ...data }
  write(db)
  return db.servers[idx]
}

export function getHealthyServers() {
  return read().servers.filter(s => s.active && s.healthy).sort((a, b) => a.priority - b.priority)
}
