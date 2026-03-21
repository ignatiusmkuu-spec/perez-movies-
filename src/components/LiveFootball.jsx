import { useState, useRef, useCallback } from 'react'
import './LiveFootball.css'

// Every major section on CricFy TV
const SECTIONS = [
  { label: '🏠 Home',           path: '/' },
  { label: '⚽ Football',       path: '/football-streams' },
  { label: '🏏 Cricket',        path: '/cricket-streaming' },
  { label: '🎾 Tennis',         path: '/tennis-streams' },
  { label: '🏀 Basketball',     path: '/nba-streams' },
  { label: '🏒 Hockey',         path: '/nhl-streams' },
  { label: '🏈 NFL',            path: '/nfl-streams' },
  { label: '⚾ Baseball',       path: '/mlb-streams' },
  { label: '🥊 Boxing / MMA',   path: '/boxing-streams' },
  { label: '🏎️ F1 Racing',     path: '/f1-streams' },
  { label: '🏉 Rugby',          path: '/rugby-streams' },
  { label: '🏐 Volleyball',     path: '/volleyball-streams' },
  { label: '📺 Schedule',       path: '/tv-schedule' },
]

const PROXY = '/proxy/cricfy'

export default function LiveFootball() {
  const [currentPath, setCurrentPath] = useState('/football-streams')
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeKey, setIframeKey]     = useState(0)
  const iframeRef = useRef(null)

  const navigate = useCallback((path) => {
    setCurrentPath(path)
    setIframeLoading(true)
    setIframeKey(k => k + 1)
  }, [])

  const reload = () => {
    setIframeLoading(true)
    setIframeKey(k => k + 1)
  }

  const proxyUrl = PROXY + currentPath

  const activeSection = SECTIONS.find(s => s.path === currentPath)

  return (
    <div className="lf-page">

      {/* ── Top Bar ── */}
      <div className="lf-topbar">
        <div className="lf-topbar-left">
          <div className="lf-topbar-badge">
            <span className="lf-live-dot" />
            LIVE
          </div>
          <div className="lf-topbar-title">
            CricFy TV · {activeSection?.label || 'All Sports'}
          </div>
        </div>
        <div className="lf-topbar-right">
          <button className="lf-icon-btn" onClick={reload} title="Reload">↺</button>
          <a
            href={`https://cricfy.tv${currentPath}`}
            target="_blank"
            rel="noreferrer"
            className="lf-icon-btn"
            title="Open in new tab"
          >↗</a>
        </div>
      </div>

      {/* ── Section Nav Pills ── */}
      <div className="lf-nav-scroll">
        {SECTIONS.map(s => (
          <button
            key={s.path}
            className={`lf-nav-pill ${currentPath === s.path ? 'lf-nav-pill-active' : ''}`}
            onClick={() => navigate(s.path)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Embedded Browser ── */}
      <div className="lf-browser">
        {iframeLoading && (
          <div className="lf-browser-loading">
            <div className="lf-spinner" />
            <span>Loading {activeSection?.label || 'CricFy TV'}…</span>
            <div className="lf-loading-hint">
              Streaming directly from CricFy TV via Ignatius Stream
            </div>
          </div>
        )}
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={proxyUrl}
          title="CricFy TV"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; clipboard-write; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads"
          className={`lf-iframe ${iframeLoading ? 'lf-iframe-hidden' : ''}`}
          onLoad={() => setIframeLoading(false)}
        />
      </div>

      {/* ── Footer Strip ── */}
      <div className="lf-footer-strip">
        <span>⚽ Ignatius Stream</span>
        <span>·</span>
        <span>All content from CricFy TV</span>
        <span>·</span>
        <a href="https://cricfy.tv" target="_blank" rel="noreferrer">cricfy.tv ↗</a>
      </div>

    </div>
  )
}
