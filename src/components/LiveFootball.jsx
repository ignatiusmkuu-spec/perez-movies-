import { useState, useRef, useEffect, useCallback } from 'react'
import Logo from './Logo'
import './LiveFootball.css'

const PROXY_ROOT = '/soccertv/'

function getMatchStatus(event) {
  const s = (event.status || '').toLowerCase()
  if (s === 'in progress' || s === 'ht' || s === 'live') return 'live'
  const hasScore = event.homeScore !== null && event.homeScore !== '' &&
                   event.awayScore !== null && event.awayScore !== ''
  if (hasScore && s !== 'ns' && s !== 'not started') return 'ft'
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
          {status === 'ft' && (
            <span className="fx-status-ft">FT</span>
          )}
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
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const fetchFixtures = useCallback(async () => {
    try {
      const r = await fetch('/api/fixtures/today')
      const data = await r.json()
      setEvents(data.events || [])
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFixtures()
    const timer = setInterval(fetchFixtures, 2 * 60 * 1000)
    return () => clearInterval(timer)
  }, [fetchFixtures])

  const liveCount = events.filter(e => getMatchStatus(e) === 'live').length

  return (
    <div className={`fx-strip ${collapsed ? 'fx-strip-collapsed' : ''}`}>
      <div className="fx-strip-bar" onClick={() => setCollapsed(c => !c)}>
        <div className="fx-strip-bar-left">
          <span className="fx-strip-icon">📅</span>
          <span className="fx-strip-title">Today's Fixtures</span>
          {liveCount > 0 && (
            <span className="fx-strip-live-count">
              <span className="fx-dot" />{liveCount} LIVE
            </span>
          )}
          {!loading && !error && (
            <span className="fx-strip-count">{events.length} matches</span>
          )}
        </div>
        <span className="fx-strip-chevron">{collapsed ? '▲' : '▼'}</span>
      </div>

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
            <div className="fx-empty">No matches scheduled today</div>
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
