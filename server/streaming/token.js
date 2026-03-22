/**
 * Tokenized, expiring stream URL generator.
 *
 * Each stream token is a signed JWT containing:
 *   sub  — movie ID
 *   jti  — unique token ID (for single-use enforcement)
 *   q    — quality level requested
 *   p    — protocol (hls | dash | rtmp | webrtc)
 *   ip   — optional client IP binding
 *   exp  — expiry timestamp
 *
 * The token is appended as ?t={jwt} to any streaming URL.
 * The backend validates the token before serving the real stream URL.
 */

import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { saveToken, getToken, markTokenUsed } from './db.js'

const SECRET  = process.env.STREAM_SECRET || 'ignite-stream-secret-change-in-production'
const ISSUER  = 'ignite-movies'
const DEFAULT_TTL = 4 * 60 * 60  // 4 hours in seconds

export function signStreamToken({
  movieId,
  quality  = 'auto',
  protocol = 'hls',
  clientIp = null,
  ttl      = DEFAULT_TTL,
  singleUse = false,
}) {
  const jti = uuidv4()
  const now = Math.floor(Date.now() / 1000)

  const payload = {
    sub: movieId,
    jti,
    q:   quality,
    p:   protocol,
    su:  singleUse ? 1 : 0,
    ...(clientIp ? { ip: clientIp } : {}),
  }

  const token = jwt.sign(payload, SECRET, {
    expiresIn: ttl,
    issuer:    ISSUER,
  })

  // Persist token metadata for audit / single-use enforcement
  saveToken({
    jti,
    movieId,
    quality,
    protocol,
    clientIp,
    singleUse,
    expiresAt: new Date((now + ttl) * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    usedAt:    null,
    useCount:  0,
  })

  return { token, jti, expiresIn: ttl }
}

export function verifyStreamToken(token, clientIp = null) {
  let payload
  try {
    payload = jwt.verify(token, SECRET, { issuer: ISSUER })
  } catch (err) {
    return { valid: false, reason: err.message }
  }

  const record = getToken(payload.jti)
  if (!record) return { valid: false, reason: 'token_not_found' }

  // Optional IP binding check
  if (record.clientIp && clientIp && record.clientIp !== clientIp) {
    return { valid: false, reason: 'ip_mismatch' }
  }

  // Single-use enforcement
  if (record.singleUse && record.useCount > 0) {
    return { valid: false, reason: 'token_already_used' }
  }

  markTokenUsed(payload.jti)
  return { valid: true, payload, record }
}

export function buildStreamUrl(baseUrl, token, { quality, protocol } = {}) {
  const suffix = protocol === 'hls'  ? '/playlist.m3u8'
               : protocol === 'dash' ? '/manifest.mpd'
               : protocol === 'rtmp' ? '/stream'
               : '/stream'

  const url = new URL(baseUrl)
  url.pathname = (url.pathname + suffix).replace('//', '/')
  if (quality && quality !== 'auto') url.pathname = url.pathname.replace('/stream', `/${quality}/stream`)
  url.searchParams.set('t', token)

  return url.toString()
}

export function extractClientIp(req) {
  return (
    req.headers['cf-connecting-ip']    ||
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress            ||
    null
  )
}
