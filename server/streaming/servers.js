/**
 * Multi-server manager with automatic failover.
 *
 * Architecture:
 *   Primary Server  →  Backup 1  →  Backup 2  →  ...
 *
 * On every health check cycle (configurable), each server is polled.
 * If the primary becomes unhealthy, traffic automatically routes to the
 * next healthy server in priority order.
 *
 * Supported protocols: HLS, MPEG-DASH, RTMP, WebRTC
 */

import fetch from 'node-fetch'
import { listServers, updateServer, getHealthyServers } from './db.js'

const HEALTH_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000')
const HEALTH_TIMEOUT  = 5000
const MAX_FAIL_COUNT  = 3  // failures before marking unhealthy

const failCounts = {}
let healthTimer  = null

/* ── Health check for a single server ── */
async function pingServer(server) {
  if (!server.healthUrl && !server.baseUrl) return true

  const url = server.healthUrl || server.baseUrl
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(HEALTH_TIMEOUT),
      headers: { 'User-Agent': 'IgniteMovies-HealthCheck/1.0' },
    })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

/* ── Run health checks on all configured servers ── */
export async function runHealthChecks() {
  const servers = listServers()
  const results = []

  for (const server of servers) {
    const healthy = await pingServer(server)

    if (!healthy) {
      failCounts[server.id] = (failCounts[server.id] || 0) + 1
    } else {
      failCounts[server.id] = 0
    }

    const isHealthy = failCounts[server.id] < MAX_FAIL_COUNT

    updateServer(server.id, {
      healthy:   isHealthy,
      lastCheck: new Date().toISOString(),
      failCount: failCounts[server.id] || 0,
    })

    results.push({ id: server.id, name: server.name, healthy: isHealthy, failCount: failCounts[server.id] || 0 })
  }

  return results
}

/* ── Start background health check loop ── */
export function startHealthChecks() {
  if (healthTimer) return
  console.log(`[StreamMgr] Health checks every ${HEALTH_INTERVAL / 1000}s`)
  healthTimer = setInterval(async () => {
    try {
      await runHealthChecks()
    } catch (err) {
      console.error('[StreamMgr] Health check error:', err.message)
    }
  }, HEALTH_INTERVAL)
}

export function stopHealthChecks() {
  if (healthTimer) { clearInterval(healthTimer); healthTimer = null }
}

/* ── Pick the best server for a given protocol ── */
export function pickServer(protocol = 'hls') {
  const servers = getHealthyServers()

  // Prefer exact protocol match
  const match = servers.find(s => s.protocol === protocol)
  if (match) return match

  // Fallback: any healthy server
  return servers[0] || null
}

/* ── Build all stream URLs for a movie (all qualities + protocols) ── */
export function buildStreamManifest(movieId, movieSources, signTokenFn) {
  const QUALITIES = ['360p', '480p', '720p', '1080p', '4k', 'auto']
  const PROTOCOLS = ['hls', 'dash', 'rtmp', 'webrtc']

  const manifest = {}

  for (const protocol of PROTOCOLS) {
    manifest[protocol] = {}
    const server = pickServer(protocol)
    if (!server) {
      manifest[protocol]._error = 'no_server_available'
      continue
    }

    // Match sources or generate URL patterns
    for (const quality of QUALITIES) {
      const source = movieSources.find(s =>
        s.protocol === protocol &&
        (s.quality === quality || (quality === 'auto' && s.isPrimary))
      )

      const baseUrl = source?.cdnUrl || source?.url || `${server.baseUrl}/movies/${movieId}`
      const { token } = signTokenFn({ movieId, quality, protocol })

      const streamUrl = buildProtocolUrl(baseUrl, protocol, quality, token)
      manifest[protocol][quality] = { url: streamUrl, server: server.name }
    }
  }

  return manifest
}

function buildProtocolUrl(base, protocol, quality, token) {
  const qPath = quality !== 'auto' ? `/${quality}` : ''

  switch (protocol) {
    case 'hls':
      return `${base}${qPath}/playlist.m3u8?t=${token}`
    case 'dash':
      return `${base}${qPath}/manifest.mpd?t=${token}`
    case 'rtmp':
      // RTMP URLs don't carry tokens in the URL — signed via stream key
      return base.replace('https://', 'rtmp://').replace('http://', 'rtmp://') + `${qPath}/stream`
    case 'webrtc':
      return `wss://${new URL(base).host}/webrtc${qPath}?movie=${token}`
    default:
      return `${base}${qPath}/stream?t=${token}`
  }
}

/* ── Manual failover: mark current primary unhealthy, elect next ── */
export function triggerFailover(fromServerId) {
  updateServer(fromServerId, { healthy: false, failCount: MAX_FAIL_COUNT })
  const next = pickServer('hls')
  return next
}

/* ── Server status report ── */
export async function getServerStatus() {
  const servers = listServers()
  return servers.map(s => ({
    id:        s.id,
    name:      s.name,
    protocol:  s.protocol,
    priority:  s.priority,
    healthy:   s.healthy,
    active:    s.active,
    lastCheck: s.lastCheck,
    failCount: failCounts[s.id] || 0,
  }))
}
