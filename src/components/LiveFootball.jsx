import { useState, useEffect, useCallback, useRef } from 'react'
import './LiveFootball.css'

const TEAM_CDN   = '/proxy/koora-cdn/uploads/team/'
const LEAGUE_CDN = '/proxy/koora-cdn/uploads/league/'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70'%3E%3Crect fill='%23222' width='70' height='70'/%3E%3C/svg%3E"

function getOffsetDate(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatDisplayDate(dateStr) {
  const [y, m, day] = dateStr.split('-').map(Number)
  return new Date(y, m-1, day).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
}

const STATUS_MAP = {
  '0': { label: 'Soon',     cls: 'pf-soon' },
  '1': { label: 'LIVE',     cls: 'pf-live' },
  '2': { label: 'Finished', cls: 'pf-finished' },
  '3': { label: 'Soon',     cls: 'pf-soon' },
}

export default function PerezFootball() {
  const [dateOffset, setDateOffset]     = useState(0)
  const [matches,    setMatches]        = useState([])
  const [loading,    setLoading]        = useState(true)
  const [filter,     setFilter]         = useState('all')
  const [selected,   setSelected]       = useState(null)
  const [channels,   setChannels]       = useState([])
  const [loadingCh,  setLoadingCh]      = useState(false)
  const [activeChIdx, setActiveChIdx]   = useState(0)
  const [iframeKey,  setIframeKey]      = useState(0)
  const refreshRef = useRef(null)

  const selectedDate = getOffsetDate(dateOffset)

  const fetchMatches = useCallback(async (date) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/koora/matches?date=${date}`)
      const data = await r.json()
      setMatches(Array.isArray(data.matches) ? data.matches : [])
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches(selectedDate)
    clearInterval(refreshRef.current)
    refreshRef.current = setInterval(() => fetchMatches(selectedDate), 60000)
    return () => clearInterval(refreshRef.current)
  }, [selectedDate, fetchMatches])

  const openMatch = async (match) => {
    setSelected(match)
    setChannels([])
    setActiveChIdx(0)
    setIframeKey(k => k + 1)
    setLoadingCh(true)
    try {
      const r = await fetch(`/api/koora/match/${match.id}`)
      const data = await r.json()
      setChannels(Array.isArray(data.channels) ? data.channels : [])
    } catch {
      setChannels([])
    } finally {
      setLoadingCh(false)
    }
  }

  const closeMatch = () => {
    setSelected(null)
    setChannels([])
  }

  const filteredMatches = matches.filter(m => {
    if (filter === 'live')     return m.status === 1 || m.status === '1'
    if (filter === 'upcoming') return m.status === 0 || m.status === '0' || m.status === 3 || m.status === '3'
    if (filter === 'finished') return m.status === 2 || m.status === '2'
    return true
  })

  const liveCount = matches.filter(m => m.status === 1 || m.status === '1').length

  if (selected) {
    return (
      <MatchPlayer
        match={selected}
        channels={channels}
        loading={loadingCh}
        activeChIdx={activeChIdx}
        setActiveChIdx={setActiveChIdx}
        iframeKey={iframeKey}
        setIframeKey={setIframeKey}
        onBack={closeMatch}
      />
    )
  }

  return (
    <div className="pf-page">
      <div className="pf-header">
        <div className="pf-header-left">
          <span className="pf-logo-text">⚽ Perez Football</span>
          {liveCount > 0 && (
            <span className="pf-live-badge">
              <span className="pf-live-dot" /> {liveCount} LIVE
            </span>
          )}
        </div>
        <button className="pf-refresh-btn" onClick={() => fetchMatches(selectedDate)} title="Refresh">↺</button>
      </div>

      <div className="pf-date-tabs">
        {[-1, 0, 1].map(offset => (
          <button
            key={offset}
            className={`pf-date-tab ${dateOffset === offset ? 'pf-date-tab-active' : ''}`}
            onClick={() => setDateOffset(offset)}
          >
            {offset === -1 ? 'Yesterday' : offset === 0 ? 'Today' : 'Tomorrow'}
            <span className="pf-date-sub">{formatDisplayDate(getOffsetDate(offset))}</span>
          </button>
        ))}
      </div>

      <div className="pf-filters">
        {[['all','All'],['live','🔴 Live'],['upcoming','⏳ Upcoming'],['finished','✓ Finished']].map(([k,l]) => (
          <button
            key={k}
            className={`pf-filter-pill ${filter === k ? 'pf-filter-active' : ''}`}
            onClick={() => setFilter(k)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="pf-list">
        {loading ? (
          <div className="pf-loading">
            <div className="pf-spinner" />
            <span>Loading matches…</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="pf-empty">No matches found</div>
        ) : (
          filteredMatches.map(match => (
            <MatchCard key={match.id} match={match} onOpen={openMatch} />
          ))
        )}
      </div>

      <div className="pf-footer">
        <span>⚽ Perez Football</span>
        <span>·</span>
        <span>Live football powered by Perez Stream</span>
      </div>
    </div>
  )
}

function MatchCard({ match, onOpen }) {
  const status = STATUS_MAP[String(match.status)] || STATUS_MAP['0']
  const hasStream = match.active == 1 && match.has_channels == 1
  const homeLogo  = match.home_logo   ? TEAM_CDN   + match.home_logo   : PLACEHOLDER
  const awayLogo  = match.away_logo   ? TEAM_CDN   + match.away_logo   : PLACEHOLDER
  const leagueLogo = match.league_logo ? LEAGUE_CDN + match.league_logo : null

  const scoreDisplay = (() => {
    if (match.status == 1 || match.status == 2) {
      const s = match.score || '-'
      const parts = s.split('-')
      if (parts.length === 2) return { home: parts[0].trim(), away: parts[1].trim() }
    }
    return null
  })()

  return (
    <div
      className={`pf-card ${hasStream ? 'pf-card-streamable' : ''} ${match.status == 1 ? 'pf-card-live' : ''}`}
      onClick={() => hasStream && onOpen(match)}
    >
      <div className="pf-card-league">
        {leagueLogo && <img src={leagueLogo} alt="" className="pf-league-logo" onError={e => e.target.style.display='none'} />}
        <span>{match.league_en || match.league || 'League'}</span>
        <span className={`pf-status-badge ${status.cls}`}>{status.label}</span>
        {hasStream && <span className="pf-stream-badge">▶ Watch</span>}
      </div>
      <div className="pf-card-inner">
        <div className="pf-team pf-team-home">
          <img src={homeLogo} alt={match.home_en} className="pf-team-logo" onError={e => e.target.src=PLACEHOLDER} />
          <span className="pf-team-name">{match.home_en || match.home}</span>
        </div>
        <div className="pf-score-block">
          {scoreDisplay ? (
            <div className="pf-score">
              <span>{scoreDisplay.home}</span>
              <span className="pf-score-sep">-</span>
              <span>{scoreDisplay.away}</span>
            </div>
          ) : (
            <div className="pf-time">{match.time || '--:--'}</div>
          )}
          {match.status == 1 && <div className="pf-live-pulse">LIVE</div>}
        </div>
        <div className="pf-team pf-team-away">
          <img src={awayLogo} alt={match.away_en} className="pf-team-logo" onError={e => e.target.src=PLACEHOLDER} />
          <span className="pf-team-name">{match.away_en || match.away}</span>
        </div>
      </div>
    </div>
  )
}

function MatchPlayer({ match, channels, loading, activeChIdx, setActiveChIdx, iframeKey, setIframeKey, onBack }) {
  const homeLogo = match.home_logo ? TEAM_CDN + match.home_logo : PLACEHOLDER
  const awayLogo = match.away_logo ? TEAM_CDN + match.away_logo : PLACEHOLDER
  const [iframeLoading, setIframeLoading] = useState(true)

  const activeChannel = channels[activeChIdx] || null

  const getIframeSrc = (ch) => {
    if (!ch) return null
    return `/proxy/koora-stream?url=${encodeURIComponent(ch.link)}`
  }

  const iframeSrc = getIframeSrc(activeChannel)

  return (
    <div className="pf-player-page">
      <div className="pf-player-topbar">
        <button className="pf-back-btn" onClick={onBack}>← Back</button>
        <div className="pf-player-title">
          <span className="pf-logo-text">⚽ Perez Football</span>
        </div>
        <button className="pf-reload-btn" onClick={() => { setIframeLoading(true); setIframeKey(k=>k+1) }}>↺</button>
      </div>

      <div className="pf-matchup">
        <div className="pf-matchup-team">
          <img src={homeLogo} alt={match.home_en} className="pf-matchup-logo" onError={e => e.target.src=PLACEHOLDER} />
          <span className="pf-matchup-name">{match.home_en || match.home}</span>
        </div>
        <div className="pf-matchup-score">
          <div className="pf-matchup-score-text">
            {match.status == 1 || match.status == 2 ? (match.score || 'vs') : match.time || 'vs'}
          </div>
          {match.status == 1 && <div className="pf-live-badge-sm"><span className="pf-live-dot"/>LIVE</div>}
          <div className="pf-matchup-league">{match.league_en || match.league}</div>
        </div>
        <div className="pf-matchup-team">
          <img src={awayLogo} alt={match.away_en} className="pf-matchup-logo" onError={e => e.target.src=PLACEHOLDER} />
          <span className="pf-matchup-name">{match.away_en || match.away}</span>
        </div>
      </div>

      {channels.length > 0 && (
        <div className="pf-servers">
          <span className="pf-servers-label">Servers:</span>
          {channels.map((ch, i) => (
            <button
              key={ch.id || i}
              className={`pf-server-btn ${activeChIdx === i ? 'pf-server-active' : ''}`}
              onClick={() => { setActiveChIdx(i); setIframeLoading(true); setIframeKey(k=>k+1) }}
            >
              {ch.server_name_en || ch.server_name || `Server ${i+1}`}
            </button>
          ))}
        </div>
      )}

      <div className="pf-iframe-wrap">
        {(loading || iframeLoading) && (
          <div className="pf-iframe-loading">
            <div className="pf-spinner" />
            <span>{loading ? 'Loading channels…' : 'Loading stream…'}</span>
          </div>
        )}
        {!loading && iframeSrc ? (
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className={`pf-iframe ${iframeLoading ? 'pf-iframe-hidden' : ''}`}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
            onLoad={() => setIframeLoading(false)}
          />
        ) : !loading && channels.length === 0 ? (
          <div className="pf-no-stream">
            <div className="pf-no-stream-icon">⚽</div>
            <div>No streams available for this match</div>
            <div className="pf-no-stream-hint">Check back closer to kick-off time</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
