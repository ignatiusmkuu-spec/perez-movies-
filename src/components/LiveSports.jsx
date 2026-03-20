import { useState, useEffect, useRef } from 'react'
import './LiveSports.css'

const LIVE_CHANNELS = [
  { id: 1,  name: 'beIN Sports HD1',     emoji: '📺', color: '#004b87', url: 'https://www.beinsports.com/en/' },
  { id: 2,  name: 'beIN Sports HD2',     emoji: '📺', color: '#004b87', url: 'https://www.beinsports.com/en/' },
  { id: 3,  name: 'Sky Sports Football', emoji: '🌤', color: '#00b2ff', url: 'https://www.skysports.com/watch' },
  { id: 4,  name: 'Sky Sports PL',       emoji: '🌤', color: '#00b2ff', url: 'https://www.skysports.com/watch' },
  { id: 5,  name: 'ESPN FC',             emoji: '🎯', color: '#cc0000', url: 'https://www.espn.com/watch/' },
  { id: 6,  name: 'TNT Sports 1',        emoji: '🏆', color: '#ff6600', url: 'https://www.tntsports.co.uk/' },
  { id: 7,  name: 'SuperSport HD',       emoji: '⚡', color: '#1a1a5e', url: 'https://supersport.com/live/' },
  { id: 8,  name: 'SuperSport PSL',      emoji: '⚡', color: '#1a1a5e', url: 'https://supersport.com/live/' },
  { id: 9,  name: 'Canal+ Sport',        emoji: '🎬', color: '#000000', url: 'https://www.mycanal.fr/' },
  { id: 10, name: 'DAZN Football',       emoji: '🔥', color: '#ff0000', url: 'https://www.dazn.com/' },
  { id: 11, name: 'Eurosport 1',         emoji: '🏅', color: '#ff6600', url: 'https://www.eurosport.com/' },
  { id: 12, name: 'Al Jazeera Sports',   emoji: '🌍', color: '#007a3d', url: 'https://www.aljazeera.com/sports/' },
]

const COMPETITION_FILTERS = [
  'All', 'Champions League', 'Europa League', 'Premier League',
  'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'World Cup', 'EURO',
]

function extractEmbedUrl(embedHtml) {
  const match = embedHtml.match(/src='([^']+)'/)
  return match ? match[1] : null
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (now - d) / 1000 / 60 / 60
  if (diff < 24) return `${Math.floor(diff)}h ago`
  if (diff < 48) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function MatchCard({ match, onClick, active }) {
  const thumb = match.thumbnail
  const teams = match.title.split(' - ')
  const home = teams[0] || 'Home'
  const away = teams[1] || 'Away'

  return (
    <div className={`match-card ${active ? 'match-active' : ''}`} onClick={onClick}>
      {thumb ? (
        <div className="match-thumb" style={{ backgroundImage: `url(${thumb})` }}>
          <div className="match-thumb-overlay">
            <span className="match-play-btn">▶</span>
          </div>
          <span className="match-time-badge">{formatDate(match.date)}</span>
        </div>
      ) : (
        <div className="match-thumb match-thumb-placeholder">
          <span className="match-play-btn">▶</span>
        </div>
      )}
      <div className="match-info">
        <div className="match-teams">
          <span className="match-team home">{home}</span>
          <span className="match-vs">vs</span>
          <span className="match-team away">{away}</span>
        </div>
        <div className="match-comp">{match.competition}</div>
      </div>
    </div>
  )
}

export default function LiveSports() {
  const [tab, setTab] = useState('highlights')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [activeMatch, setActiveMatch] = useState(null)
  const [embedUrl, setEmbedUrl] = useState(null)
  const [loadingEmbed, setLoadingEmbed] = useState(false)
  const playerRef = useRef(null)

  useEffect(() => {
    if (tab !== 'highlights') return
    setLoading(true)
    setError(null)
    fetch('/proxy/scorebat/')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMatches(data.filter(m => m.videos && m.videos.length > 0))
        } else if (data.response) {
          setMatches(data.response.filter(m => m.videos && m.videos.length > 0))
        } else {
          setMatches([])
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load matches. Check connection.')
        setLoading(false)
      })
  }, [tab])

  const filteredMatches = filter === 'All'
    ? matches
    : matches.filter(m =>
        m.competition.toLowerCase().includes(filter.toLowerCase()) ||
        m.competitionUrl?.toLowerCase().includes(filter.toLowerCase().replace(/ /g, '-'))
      )

  const handleMatchClick = (match) => {
    const vid = match.videos[0]
    if (!vid) return
    const url = extractEmbedUrl(vid.embed)
    setActiveMatch(match)
    setEmbedUrl(url)
    setLoadingEmbed(true)
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleChannelClick = (ch) => {
    window.open(ch.url, '_blank', 'noopener')
  }

  return (
    <div className="sports-section">
      <div className="sports-header">
        <div className="live-dot" />
        <h2>Football Streams</h2>
        <span className="live-label">LIVE</span>
      </div>

      <div className="sports-tabs">
        <button className={`sport-tab ${tab === 'highlights' ? 'active' : ''}`} onClick={() => setTab('highlights')}>
          ⚽ Highlights & Replays
        </button>
        <button className={`sport-tab ${tab === 'channels' ? 'active' : ''}`} onClick={() => setTab('channels')}>
          📡 Live Channels
        </button>
      </div>

      {tab === 'highlights' && (
        <>
          {activeMatch && embedUrl && (
            <div className="match-player" ref={playerRef}>
              <div className="match-player-header">
                <div>
                  <div className="match-player-title">{activeMatch.title}</div>
                  <div className="match-player-comp">{activeMatch.competition}</div>
                </div>
                <button className="match-player-close" onClick={() => { setActiveMatch(null); setEmbedUrl(null) }}>✕</button>
              </div>
              <div className="match-player-frame">
                {loadingEmbed && (
                  <div className="match-player-loading">
                    <div className="spinner" />
                    <p>Loading stream...</p>
                  </div>
                )}
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                  style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                  onLoad={() => setLoadingEmbed(false)}
                />
              </div>
              <div className="match-player-actions">
                {activeMatch.videos.length > 1 && activeMatch.videos.map((v, i) => (
                  <button
                    key={i}
                    className={`source-btn ${embedUrl === extractEmbedUrl(v.embed) ? 'active' : ''}`}
                    onClick={() => { setEmbedUrl(extractEmbedUrl(v.embed)); setLoadingEmbed(true) }}
                  >
                    {v.title || `Stream ${i + 1}`}
                  </button>
                ))}
                <a
                  href={activeMatch.matchviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="action-btn watch"
                  style={{ padding: '7px 14px', textDecoration: 'none' }}
                >
                  🔗 Full Page
                </a>
              </div>
            </div>
          )}

          <div className="comp-filter-row">
            {COMPETITION_FILTERS.map(f => (
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
            <div className="match-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="match-skeleton">
                  <div className="skel-thumb" />
                  <div className="skel-info">
                    <div className="skel-line long" />
                    <div className="skel-line short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="match-error">
              <span>⚠ {error}</span>
            </div>
          )}

          {!loading && !error && filteredMatches.length === 0 && (
            <div className="match-empty">
              No matches found for "{filter}". Try a different filter.
            </div>
          )}

          <div className="match-grid">
            {filteredMatches.map((m, i) => (
              <MatchCard
                key={i}
                match={m}
                active={activeMatch?.title === m.title}
                onClick={() => handleMatchClick(m)}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'channels' && (
        <div className="channels-section">
          <div className="channels-hint">
            Click a channel to open its official live stream in a new tab
          </div>
          <div className="channels-grid">
            {LIVE_CHANNELS.map(ch => (
              <div
                key={ch.id}
                className="channel-card"
                style={{ '--ch-color': ch.color }}
                onClick={() => handleChannelClick(ch)}
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
