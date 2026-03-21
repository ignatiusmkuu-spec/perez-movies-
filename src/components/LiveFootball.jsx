import { useState, useRef } from 'react'
import './LiveFootball.css'

const IGNATIUS_STREAMS = [
  {
    id: 'ign-1',
    num: '1',
    name: 'Ignatius Stream 1',
    sub: 'Live Football • HD Quality',
    powered: 'CricFy TV',
    icon: '📡',
    color: '#10b981',
    embedUrl: 'https://cricfy.tv/football-streams',
    extUrl: 'https://cricfy.tv/football-streams',
  },
  {
    id: 'ign-2',
    num: '2',
    name: 'Ignatius Stream 2',
    sub: 'Sports & Entertainment',
    powered: 'ShowMax',
    icon: '🎬',
    color: '#3b82f6',
    embedUrl: '/proxy/showmax',
    extUrl: 'https://showmax.com',
  },
]

const QUICK_LINKS = [
  { name: 'SportSurge',   icon: '⚡', url: 'https://sportsurge.net/#Soccer',          color: '#f97316' },
  { name: 'StreamEast',   icon: '🔴', url: 'https://streameast.to/soccer',             color: '#ef4444' },
  { name: 'VIPBox',       icon: '📺', url: 'https://vipboxtv.se/soccer/',              color: '#8b5cf6' },
  { name: 'DaddyLive',    icon: '🏆', url: 'https://daddylive.mp/schedule/soccer.php', color: '#f59e0b' },
  { name: 'Footybite',    icon: '⚽', url: 'https://www.footybite.do',                 color: '#22c55e' },
  { name: 'CrackStreams', icon: '🔥', url: 'https://crackstreams.io',                  color: '#ec4899' },
]

export default function LiveFootball() {
  const [activeStream, setActiveStream] = useState(null)
  const [loading, setLoading] = useState(false)
  const playerRef = useRef(null)

  const handleSelect = (s) => {
    if (activeStream?.id === s.id) {
      setActiveStream(null)
      return
    }
    setActiveStream(s)
    setLoading(true)
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  return (
    <div className="lf-page">

      {/* ── Hero Banner ── */}
      <div className="lf-hero">
        <div className="lf-hero-bg" />
        <div className="lf-hero-content">
          <div className="lf-hero-badge">
            <span className="lf-live-dot" />
            LIVE
          </div>
          <h1 className="lf-hero-title">Live Football</h1>
          <p className="lf-hero-sub">Ignatius Stream — Watch inside the site, no redirects</p>
        </div>
        <div className="lf-ball-anim">⚽</div>
      </div>

      {/* ── Stream Selector ── */}
      <div className="lf-section-label">Choose a Stream</div>
      <div className="lf-stream-list">
        {IGNATIUS_STREAMS.map(s => (
          <div
            key={s.id}
            className={`lf-stream-card ${activeStream?.id === s.id ? 'lf-card-active' : ''}`}
            style={{ '--c': s.color }}
            onClick={() => handleSelect(s)}
          >
            <div className="lf-card-glow" />

            {/* Number badge */}
            <div className="lf-card-num" style={{ background: s.color }}>{s.num}</div>

            <div className="lf-card-icon">{s.icon}</div>
            <div className="lf-card-info">
              <div className="lf-card-name">{s.name}</div>
              <div className="lf-card-sub">{s.sub}</div>
              <div className="lf-card-powered">Powered by {s.powered}</div>
            </div>

            <div className="lf-card-cta" style={{ background: activeStream?.id === s.id ? '#e50914' : s.color }}>
              {activeStream?.id === s.id
                ? <><span>■</span> Close</>
                : <><span>▶</span> Play</>
              }
            </div>
          </div>
        ))}
      </div>

      {/* ── Inline Player ── */}
      {activeStream && (
        <div className="lf-player-wrap" ref={playerRef}>
          {/* Player Header */}
          <div className="lf-player-header" style={{ '--c': activeStream.color }}>
            <div className="lf-player-left">
              <div className="lf-player-dot-wrap">
                <span className="lf-player-live-dot" />
                <span className="lf-player-live-txt">LIVE</span>
              </div>
              <div>
                <div className="lf-player-title">{activeStream.name}</div>
                <div className="lf-player-meta">{activeStream.sub} · {activeStream.powered}</div>
              </div>
            </div>
            <div className="lf-player-right">
              <a
                href={activeStream.extUrl}
                target="_blank"
                rel="noreferrer"
                className="lf-tab-btn"
              >
                ↗ Full Screen
              </a>
              <button className="lf-close-btn" onClick={() => setActiveStream(null)}>✕</button>
            </div>
          </div>

          {/* Video Frame */}
          <div className="lf-frame">
            {loading && (
              <div className="lf-loading">
                <div className="lf-spinner" style={{ borderTopColor: activeStream.color }} />
                <span>Loading {activeStream.name}…</span>
              </div>
            )}
            <iframe
              key={activeStream.id}
              src={activeStream.embedUrl}
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              onLoad={() => setLoading(false)}
            />
          </div>

          <div className="lf-player-foot">
            ⚽ Ignatius Stream · Live Football · Playing in-site
          </div>
        </div>
      )}

      {/* ── Quick Links ── */}
      <div className="lf-section-label" style={{ marginTop: 20 }}>More Sources <span>(opens new tab)</span></div>
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
        Ignatius Stream · Live Football · All streams are free to watch
      </div>
    </div>
  )
}
