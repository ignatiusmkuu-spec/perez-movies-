import { useState, useRef, useEffect, useCallback } from 'react'
import Logo from './Logo'
import './LiveFootball.css'

const PROXY_ROOT = '/soccertv/'

const DATE_TABS = [
  { offset: -1, label: 'Yesterday' },
  { offset:  0, label: 'Today'     },
  { offset:  1, label: 'Tomorrow'  },
]

function getOffsetDate(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function formatSubDate(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getMatchStatus(event) {
  const s = (event.status || '').toLowerCase()
  if (s === 'in progress' || s === 'ht' || s === '1h' || s === '2h' || s === 'live') return 'live'
  const hasScore = event.homeScore !== null && event.homeScore !== '' &&
                   event.awayScore !== null && event.awayScore !== ''
  if (hasScore && s !== 'ns' && s !== 'not started' && s !== '') return 'ft'
  return 'upcoming'
}

function FixtureCard({ event }) {
  const status = getMatchStatus(event)
  const hasScore = event.homeScore !== null && event.homeScore !== ''

  return (
    <div className={`fx-card ${status === 'live' ? 'fx-card-live' : ''}`}>
      <div className="fx-league">
        {event.leagueBadge && (
          <img src={event.leagueBadge} alt="" className="fx-league-badge"
               onError={e => e.target.style.display = 'none'} />
        )}
        <span className="fx-league-name">{event.league}</span>
      </div>

      <div className="fx-matchup">
        <div className="fx-team">
          {event.homeBadge && (
            <img src={event.homeBadge} alt="" className="fx-team-badge"
                 onError={e => e.target.style.display = 'none'} />
          )}
          <span className="fx-team-name">{event.home}</span>
        </div>

        <div className="fx-score-block">
          {status === 'live' && (
            <span className="fx-status-live"><span className="fx-dot" />LIVE</span>
          )}
          {status === 'ft' && <span className="fx-status-ft">FT</span>}
          {hasScore ? (
            <div className="fx-score">{event.homeScore} – {event.awayScore}</div>
          ) : (
            <div className="fx-time">{event.localTime || event.time}</div>
          )}
        </div>

        <div className="fx-team fx-team-away">
          {event.awayBadge && (
            <img src={event.awayBadge} alt="" className="fx-team-badge"
                 onError={e => e.target.style.display = 'none'} />
          )}
          <span className="fx-team-name">{event.away}</span>
        </div>
      </div>
    </div>
  )
}

function FixturesStrip() {
  const [offset, setOffset]     = useState(0)
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const fetchFixtures = useCallback(async (dateOffset) => {
    setLoading(true)
    setError(false)
    try {
      const date = getOffsetDate(dateOffset)
      const r = await fetch(`/api/fixtures/today?date=${date}`)
      const data = await r.json()
      setEvents(data.events || [])
    } catch {
      setError(true)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFixtures(offset)
    if (offset !== 0) return
    const timer = setInterval(() => fetchFixtures(0), 2 * 60 * 1000)
    return () => clearInterval(timer)
  }, [offset, fetchFixtures])

  const liveCount = events.filter(e => getMatchStatus(e) === 'live').length

  const handleTabClick = (e, newOffset) => {
    e.stopPropagation()
    if (newOffset !== offset) setOffset(newOffset)
    if (collapsed) setCollapsed(false)
  }

  return (
    <div className={`fx-strip ${collapsed ? 'fx-strip-collapsed' : ''}`}>
      {/* ── Bar: date tabs + collapse toggle ── */}
      <div className="fx-strip-bar">
        <div className="fx-date-tabs">
          {DATE_TABS.map(({ offset: off, label }) => (
            <button
              key={off}
              className={`fx-date-tab ${offset === off ? 'fx-date-tab-active' : ''}`}
              onClick={e => handleTabClick(e, off)}
            >
              {label}
              <span className="fx-date-sub">{formatSubDate(off)}</span>
            </button>
          ))}
        </div>

        <div className="fx-strip-bar-right" onClick={() => setCollapsed(c => !c)}>
          {liveCount > 0 && offset === 0 && (
            <span className="fx-strip-live-count">
              <span className="fx-dot" />{liveCount} LIVE
            </span>
          )}
          {!loading && !error && (
            <span className="fx-strip-count">{events.length} matches</span>
          )}
          <span className="fx-strip-chevron">{collapsed ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* ── Scrollable fixture cards ── */}
      {!collapsed && (
        <div className="fx-scroll">
          {loading && (
            <div className="fx-loading">
              <div className="fx-spinner" /><span>Loading fixtures…</span>
            </div>
          )}
          {error && !loading && (
            <div className="fx-empty">Could not load fixtures</div>
          )}
          {!loading && !error && events.length === 0 && (
            <div className="fx-empty">No matches scheduled</div>
          )}
          {!loading && events.map(ev => (
            <FixtureCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function IgnatiusLiveMatches() {
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState(0)
  const iframeRef = useRef(null)

  const reload = () => {
    setLoading(true)
    setKey(k => k + 1)
  }

  return (
    <div className="ilm-page">
      <div className="ilm-header">
        <div className="ilm-header-left">
          <Logo className="ilm-logo" />
          <div className="ilm-title-block">
            <span className="ilm-title">Live Matches</span>
            <span className="ilm-live-badge">
              <span className="ilm-live-dot" /> LIVE
            </span>
          </div>
        </div>
        <button className="ilm-reload-btn" onClick={reload} title="Reload">↺</button>
      </div>

      <FixturesStrip />

      <div className="ilm-frame-wrap">
        {loading && (
          <div className="ilm-loading">
            <div className="ilm-spinner" />
            <span>Loading live matches…</span>
          </div>
        )}
        <iframe
          key={key}
          ref={iframeRef}
          src={PROXY_ROOT}
          className={`ilm-iframe ${loading ? 'ilm-iframe-hidden' : ''}`}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={() => setLoading(false)}
          title="Ignatius Live Matches"
        />
      </div>
    </div>
  )
}
