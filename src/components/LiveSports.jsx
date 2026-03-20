import { useState, useEffect, useRef } from 'react'
import './LiveSports.css'

const LIVE_STREAM_SITES = [
  { name: 'SportSurge',   icon: '⚡', url: 'https://sportsurge.net/#Soccer',        color: '#f97316' },
  { name: 'StreamEast',   icon: '🔴', url: 'https://streameast.to/soccer',           color: '#ef4444' },
  { name: 'VIPBox',       icon: '📺', url: 'https://vipboxtv.se/soccer/',            color: '#8b5cf6' },
  { name: 'Footybite',    icon: '⚽', url: 'https://www.footybite.do',               color: '#22c55e' },
  { name: 'LiveSoccerTV', icon: '🎯', url: 'https://www.livesoccertv.com',           color: '#3b82f6' },
  { name: 'DaddyLive',    icon: '🏆', url: 'https://daddylive.mp/schedule/soccer.php', color: '#f59e0b' },
  { name: 'SportsBay',    icon: '🌐', url: 'https://www.sportsbay.org/soccer',       color: '#06b6d4' },
  { name: 'CrackStreams', icon: '🔥', url: 'https://crackstreams.io',                color: '#ec4899' },
]

const LIVE_CHANNELS = [
  { id: 1,  name: 'beIN Sports HD1',     emoji: '📺', color: '#004b87', url: 'https://www.beinsports.com/en/' },
  { id: 2,  name: 'Sky Sports Football', emoji: '🌤', color: '#00b2ff', url: 'https://www.skysports.com/watch' },
  { id: 3,  name: 'ESPN FC',             emoji: '🎯', color: '#cc0000', url: 'https://www.espn.com/watch/' },
  { id: 4,  name: 'TNT Sports 1',        emoji: '🏆', color: '#ff6600', url: 'https://www.tntsports.co.uk/' },
  { id: 5,  name: 'SuperSport HD',       emoji: '⚡', color: '#1a1a5e', url: 'https://supersport.com/live/' },
  { id: 6,  name: 'DAZN Sports',         emoji: '🔥', color: '#ff0000', url: 'https://www.dazn.com/' },
  { id: 7,  name: 'Eurosport 1',         emoji: '🏅', color: '#ff6600', url: 'https://www.eurosport.com/' },
  { id: 8,  name: 'Al Jazeera Sports',   emoji: '🌍', color: '#007a3d', url: 'https://www.aljazeera.com/sports/' },
  { id: 9,  name: 'Sky Sports PL',       emoji: '🌤', color: '#00b2ff', url: 'https://www.skysports.com/watch' },
  { id: 10, name: 'Canal+ Sport',        emoji: '🎬', color: '#000000', url: 'https://www.mycanal.fr/' },
  { id: 11, name: 'beIN Sports HD2',     emoji: '📺', color: '#004b87', url: 'https://www.beinsports.com/en/' },
  { id: 12, name: 'SuperSport PSL',      emoji: '⚡', color: '#1a1a5e', url: 'https://supersport.com/live/' },
]

const COMP_FILTERS = [
  'All', 'Champions League', 'Europa League', 'Premier League',
  'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'World Cup',
]

function extractEmbed(embedHtml) {
  if (!embedHtml) return null
  const m = embedHtml.match(/src='([^']+)'/) || embedHtml.match(/src="([^"]+)"/)
  return m ? m[1] : null
}

function teamNames(title) {
  const parts = title.split(' - ')
  return { home: parts[0] || title, away: parts[1] || '' }
}

function MatchCard({ match, onClick, active }) {
  const { home, away } = teamNames(match.title)
  const embedUrl = match.videos?.[0] ? extractEmbed(match.videos[0].embed) : null
  const thumbnail = match.thumbnail
  const compName = typeof match.competition === 'string'
    ? match.competition
    : match.competition?.name || ''

  return (
    <div className={`match-card ${active ? 'match-active' : ''}`} onClick={onClick}>
      <div
        className="match-thumb"
        style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : {}}
      >
        {!thumbnail && (
          <div className="match-no-thumb">
            <span>⚽</span>
          </div>
        )}
        <div className="match-overlay">
          <div className="match-play-circle">▶</div>
        </div>
        <span className="match-badge">{compName.split(':')[0]?.trim() || 'Football'}</span>
      </div>
      <div className="match-info">
        <div className="match-teams-row">
          <span className="match-team">{home}</span>
          <span className="match-vs">vs</span>
          <span className="match-team">{away}</span>
        </div>
        <div className="match-comp-name">{compName}</div>
        {match.videos?.length > 1 && (
          <div className="match-video-count">{match.videos.length} angles</div>
        )}
      </div>
    </div>
  )
}

export default function LiveSports() {
  const [tab, setTab]               = useState('highlights')
  const [matches, setMatches]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [filter, setFilter]         = useState('All')
  const [activeMatch, setActiveMatch] = useState(null)
  const [activeVideo, setActiveVideo] = useState(null)
  const [playerLoading, setPlayerLoading] = useState(false)
  const playerRef = useRef(null)

  useEffect(() => {
    if (tab !== 'highlights') return
    setLoading(true)
    setError(null)
    fetch('/proxy/scorebat/')
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data
          : data.response ? data.response
          : data.warning ? (Array.isArray(data) ? data : Object.values(data).find(v => Array.isArray(v)) || [])
          : []
        setMatches(arr.filter(m => m.videos?.length > 0))
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load match data.')
        setLoading(false)
      })
  }, [tab])

  const filtered = filter === 'All'
    ? matches
    : matches.filter(m => {
        const c = typeof m.competition === 'string' ? m.competition : m.competition?.name || ''
        return c.toLowerCase().includes(filter.toLowerCase())
      })

  const handleMatchClick = (match) => {
    const firstEmbed = extractEmbed(match.videos?.[0]?.embed)
    setActiveMatch(match)
    setActiveVideo(firstEmbed)
    setPlayerLoading(true)
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  return (
    <div className="sports-section">
      <div className="sports-header">
        <div className="live-dot" />
        <h2>Football Streams</h2>
        <span className="live-label">LIVE</span>
      </div>

      <div className="sports-tabs">
        <button className={`sport-tab ${tab === 'highlights' ? 'active' : ''}`} onClick={() => { setTab('highlights'); setActiveMatch(null) }}>
          🎬 Highlights & Replays
        </button>
        <button className={`sport-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
          🔴 Live Streams
        </button>
        <button className={`sport-tab ${tab === 'channels' ? 'active' : ''}`} onClick={() => setTab('channels')}>
          📡 TV Channels
        </button>
      </div>

      {tab === 'highlights' && (
        <>
          {activeMatch && activeVideo && (
            <div className="match-player" ref={playerRef}>
              <div className="match-player-header">
                <div>
                  <div className="match-player-title">{activeMatch.title}</div>
                  <div className="match-player-comp">
                    {typeof activeMatch.competition === 'string'
                      ? activeMatch.competition
                      : activeMatch.competition?.name || ''}
                  </div>
                </div>
                <button className="match-player-close" onClick={() => { setActiveMatch(null); setActiveVideo(null) }}>✕</button>
              </div>
              <div className="match-player-frame">
                {playerLoading && (
                  <div className="match-player-loading">
                    <div className="nf-spinner-arc" style={{ width: 40, height: 40, border: '3px solid #222', borderTopColor: '#e50914', borderRadius: '50%', animation: 'nf-spin 0.8s linear infinite', display: 'block' }} />
                  </div>
                )}
                <iframe
                  key={activeVideo}
                  src={activeVideo}
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  onLoad={() => setPlayerLoading(false)}
                />
              </div>
              {activeMatch.videos?.length > 1 && (
                <div className="match-player-actions">
                  <span className="sources-label">Angles:</span>
                  {activeMatch.videos.map((v, i) => {
                    const u = extractEmbed(v.embed)
                    return (
                      <button
                        key={i}
                        className={`source-btn ${activeVideo === u ? 'active' : ''}`}
                        onClick={() => { setActiveVideo(u); setPlayerLoading(true) }}
                      >
                        {v.title || `Angle ${i + 1}`}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="comp-filter-row">
            {COMP_FILTERS.map(f => (
              <button
                key={f}
                className={`comp-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {loading && (
            <div className="match-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="match-card">
                  <div className="match-thumb match-skeleton-thumb" />
                  <div className="match-info">
                    <div className="skel-line long" />
                    <div className="skel-line short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="match-error">⚠ {error}</div>}

          {!loading && !error && filtered.length === 0 && (
            <div className="match-error">No matches found for "{filter}"</div>
          )}

          {!loading && !error && (
            <div className="match-grid">
              {filtered.map((m, i) => (
                <MatchCard
                  key={i}
                  match={m}
                  active={activeMatch?.title === m.title}
                  onClick={() => handleMatchClick(m)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'live' && (
        <div className="live-streams-section">
          <div className="live-streams-notice">
            <div className="live-notice-icon">🔴</div>
            <div>
              <div className="live-notice-title">Live Football Streams</div>
              <div className="live-notice-sub">Click any source below to watch live matches now. Streams open in a new tab.</div>
            </div>
          </div>

          <div className="live-streams-grid">
            {LIVE_STREAM_SITES.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="stream-site-card"
                style={{ '--site-color': s.color }}
              >
                <div className="stream-site-icon">{s.icon}</div>
                <div className="stream-site-name">{s.name}</div>
                <div className="stream-live-pill">
                  <span className="stream-live-dot" />
                  LIVE
                </div>
                <div className="stream-watch-label">Watch Now →</div>
              </a>
            ))}
          </div>

          <div className="live-tip-box">
            <span>💡 Tip:</span> Open streams in full screen for the best experience. Use VPN if a site is blocked in your region.
          </div>
        </div>
      )}

      {tab === 'channels' && (
        <div className="channels-section">
          <div className="channels-hint">Click a channel to open its official live stream in a new tab</div>
          <div className="channels-grid">
            {LIVE_CHANNELS.map(ch => (
              <div
                key={ch.id}
                className="channel-card"
                style={{ '--ch-color': ch.color }}
                onClick={() => window.open(ch.url, '_blank', 'noopener')}
              >
                <div className="ch-logo">{ch.emoji}</div>
                <div className="ch-name">{ch.name}</div>
                <div className="ch-live">● LIVE</div>
                <div className="ch-watch">Watch →</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
