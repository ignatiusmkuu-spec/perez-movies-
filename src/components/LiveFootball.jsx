import { useState, useEffect, useRef } from 'react'
import './LiveFootball.css'

const API = 'http://localhost:3001'

const QUICK_LINKS = [
  { name: 'SportSurge',   icon: '⚡', url: 'https://sportsurge.net/#Soccer',          color: '#f97316' },
  { name: 'StreamEast',   icon: '🔴', url: 'https://streameast.to/soccer',             color: '#ef4444' },
  { name: 'VIPBox',       icon: '📺', url: 'https://vipboxtv.se/soccer/',              color: '#8b5cf6' },
  { name: 'DaddyLive',    icon: '🏆', url: 'https://daddylive.mp/schedule/soccer.php', color: '#f59e0b' },
  { name: 'Footybite',    icon: '⚽', url: 'https://www.footybite.do',                 color: '#22c55e' },
  { name: 'CrackStreams', icon: '🔥', url: 'https://crackstreams.io',                  color: '#ec4899' },
]

export default function LiveFootball() {
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [active, setActive]     = useState(null)   // { title, proxyUrl }
  const [iframeLoading, setIframeLoading] = useState(false)
  const playerRef = useRef(null)

  // ── Fetch live matches from CricFy TV via our server ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${API}/api/cricfy-streams`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setMatches(data.matches || [])
        setLoading(false)
      })
      .catch(e => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const handleWatch = (match) => {
    if (active?.proxyUrl === match.proxyUrl) {
      setActive(null)
      return
    }
    setActive(match)
    setIframeLoading(true)
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleRefresh = () => {
    setLoading(true)
    setError(null)
    fetch(`${API}/api/cricfy-streams?bust=${Date.now()}`)
      .then(r => r.json())
      .then(data => { setMatches(data.matches || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  return (
    <div className="lf-page">

      {/* ── Hero Banner ── */}
      <div className="lf-hero">
        <div className="lf-hero-bg" />
        <div className="lf-hero-content">
          <div className="lf-hero-badge">
            <span className="lf-live-dot" />
            LIVE NOW
          </div>
          <h1 className="lf-hero-title">Live Football</h1>
          <p className="lf-hero-sub">Ignatius Stream · Streams play inside the site</p>
        </div>
        <div className="lf-ball-anim">⚽</div>
      </div>

      {/* ── Inline Player ── */}
      {active && (
        <div className="lf-player-wrap" ref={playerRef}>
          <div className="lf-player-header" style={{ '--c': '#10b981' }}>
            <div className="lf-player-left">
              <div className="lf-player-dot-wrap">
                <span className="lf-player-live-dot" />
                <span className="lf-player-live-txt">LIVE</span>
              </div>
              <div>
                <div className="lf-player-title">{active.title}</div>
                <div className="lf-player-meta">CricFy TV · Ignatius Stream</div>
              </div>
            </div>
            <div className="lf-player-right">
              <a
                href={`https://cricfy.tv${active.originalUrl || '/football-streams'}`}
                target="_blank"
                rel="noreferrer"
                className="lf-tab-btn"
              >
                ↗ Full Tab
              </a>
              <button className="lf-close-btn" onClick={() => setActive(null)}>✕ Close</button>
            </div>
          </div>

          <div className="lf-frame">
            {iframeLoading && (
              <div className="lf-loading">
                <div className="lf-spinner" style={{ borderTopColor: '#10b981' }} />
                <span>Loading stream from CricFy TV…</span>
              </div>
            )}
            <iframe
              key={active.proxyUrl}
              src={active.proxyUrl}
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; clipboard-write; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              onLoad={() => setIframeLoading(false)}
            />
          </div>

          <div className="lf-player-foot">
            ⚽ Ignatius Stream · Live Football · Powered by CricFy TV
          </div>
        </div>
      )}

      {/* ── Match List ── */}
      <div className="lf-section-head">
        <div className="lf-section-label">
          {loading ? 'Fetching live matches…' : `${matches.length} Live Matches · CricFy TV`}
        </div>
        <button className="lf-refresh-btn" onClick={handleRefresh} disabled={loading}>
          {loading ? '⏳' : '↺'} Refresh
        </button>
      </div>

      {loading && (
        <div className="lf-match-loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="lf-match-skeleton">
              <div className="lf-sk-dot" />
              <div className="lf-sk-text">
                <div className="lf-sk-line lf-sk-long" />
                <div className="lf-sk-line lf-sk-short" />
              </div>
              <div className="lf-sk-btn" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="lf-error-box">
          <div className="lf-error-icon">⚠️</div>
          <div>
            <div className="lf-error-title">Could not load matches</div>
            <div className="lf-error-sub">{error}</div>
          </div>
          <button className="lf-error-retry" onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="lf-empty">
          <div className="lf-empty-icon">📭</div>
          <div className="lf-empty-title">No live matches right now</div>
          <div className="lf-empty-sub">Check back soon or try refreshing</div>
          <button className="lf-error-retry" onClick={handleRefresh}>↺ Refresh</button>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="lf-match-list">
          {matches.map((match, i) => (
            <div
              key={i}
              className={`lf-match-row ${active?.proxyUrl === match.proxyUrl ? 'lf-match-active' : ''}`}
              onClick={() => handleWatch(match)}
            >
              <div className="lf-match-live-dot" />
              <div className="lf-match-info">
                <div className="lf-match-title">{match.title}</div>
                <div className="lf-match-src">CricFy TV · Live Football</div>
              </div>
              <button
                className={`lf-match-btn ${active?.proxyUrl === match.proxyUrl ? 'lf-match-btn-stop' : ''}`}
              >
                {active?.proxyUrl === match.proxyUrl ? '■ Stop' : '▶ Watch'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Main CricFy Football Page Button ── */}
      <div className="lf-main-stream">
        <div className="lf-ms-label">Or watch the full CricFy TV football page in-site</div>
        <button
          className="lf-ms-btn"
          onClick={() => handleWatch({ title: 'CricFy TV — All Football Streams', proxyUrl: '/proxy/cricfy/football-streams', originalUrl: '/football-streams' })}
        >
          📡 Open All Streams
        </button>
      </div>

      {/* ── More Sources ── */}
      <div className="lf-section-label" style={{ marginTop: 20 }}>
        More Sources <span>(opens new tab)</span>
      </div>
      <div className="lf-quick-grid">
        {QUICK_LINKS.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="lf-quick-card"
            style={{ '--c': l.color }}
          >
            <span className="lf-quick-icon">{l.icon}</span>
            <span className="lf-quick-name">{l.name}</span>
            <span className="lf-quick-arrow">→</span>
          </a>
        ))}
      </div>

      <div className="lf-footer">
        Ignatius Stream · Live Football · All streams powered by CricFy TV
      </div>
    </div>
  )
}
