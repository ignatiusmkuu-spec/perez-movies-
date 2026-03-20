import { useState } from 'react'
import './LiveSports.css'

const FOOTBALL_STREAMS = [
  { id: 1, name: 'Premier League', league: 'English Premier League', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', url: 'https://cricfy.tv' },
  { id: 2, name: 'La Liga', league: 'Spanish La Liga', emoji: '🇪🇸', url: 'https://cricfy.tv' },
  { id: 3, name: 'Champions League', league: 'UEFA Champions League', emoji: '⭐', url: 'https://cricfy.tv' },
  { id: 4, name: 'Serie A', league: 'Italian Serie A', emoji: '🇮🇹', url: 'https://cricfy.tv' },
  { id: 5, name: 'Bundesliga', league: 'German Bundesliga', emoji: '🇩🇪', url: 'https://cricfy.tv' },
  { id: 6, name: 'Ligue 1', league: 'French Ligue 1', emoji: '🇫🇷', url: 'https://cricfy.tv' },
  { id: 7, name: 'Africa Cup', league: 'AFCON 2025', emoji: '🌍', url: 'https://cricfy.tv' },
  { id: 8, name: 'World Cup', league: 'FIFA World Cup Quals', emoji: '🏆', url: 'https://cricfy.tv' },
]

const CRICKET_STREAMS = [
  { id: 1, name: 'IPL 2025', league: 'Indian Premier League', emoji: '🏏', url: 'https://cricfy.tv' },
  { id: 2, name: 'Test Cricket', league: 'ICC Test Series', emoji: '🎯', url: 'https://cricfy.tv' },
  { id: 3, name: 'ODI Series', league: 'One Day International', emoji: '🌟', url: 'https://cricfy.tv' },
]

const SPORTS_TABS = [
  { id: 'football', label: '⚽ Football' },
  { id: 'cricket', label: '🏏 Cricket' },
  { id: 'tv', label: '📡 Live TV' },
]

const TV_CHANNELS = [
  { id: 1, name: 'SuperSport', logo: '📺', url: 'https://www.cricfree.sc/', live: true },
  { id: 2, name: 'ESPN', logo: '🎯', url: 'https://www.cricfree.sc/', live: true },
  { id: 3, name: 'beIN Sports', logo: '⚡', url: 'https://www.cricfree.sc/', live: true },
  { id: 4, name: 'Sky Sports', logo: '🌤', url: 'https://www.cricfree.sc/', live: true },
  { id: 5, name: 'DAZN', logo: '🔥', url: 'https://www.cricfree.sc/', live: true },
  { id: 6, name: 'Eurosport', logo: '🏅', url: 'https://www.cricfree.sc/', live: true },
  { id: 7, name: 'Canal+', logo: '🎬', url: 'https://www.cricfree.sc/', live: true },
  { id: 8, name: 'Fox Sports', logo: '🦊', url: 'https://www.cricfree.sc/', live: true },
]

export default function LiveSports() {
  const [sportTab, setSportTab] = useState('football')
  const [activeStream, setActiveStream] = useState(null)
  const [embedUrl, setEmbedUrl] = useState(null)

  const streams = sportTab === 'football' ? FOOTBALL_STREAMS : sportTab === 'cricket' ? CRICKET_STREAMS : []

  const handleStreamClick = (stream) => {
    setActiveStream(stream.id)
    setEmbedUrl(stream.url)
  }

  const handleTvClick = (ch) => {
    setActiveStream(`tv-${ch.id}`)
    setEmbedUrl(ch.url)
  }

  return (
    <div className="sports-section">
      <div className="sports-header">
        <div className="live-dot" />
        <h2>Live Streams</h2>
        <span className="live-label">LIVE</span>
      </div>

      <div className="sports-tabs">
        {SPORTS_TABS.map(t => (
          <button
            key={t.id}
            className={`sport-tab ${sportTab === t.id ? 'active' : ''}`}
            onClick={() => { setSportTab(t.id); setActiveStream(null); setEmbedUrl(null) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {embedUrl && (
        <div className="player-embed-section">
          <div className="player-embed-title">
            Now Streaming: <span>{activeStream}</span>
          </div>
          <div className="embed-frame-wrap">
            <iframe
              className="embed-frame"
              src={embedUrl}
              allowFullScreen
              allow="autoplay; fullscreen"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {sportTab !== 'tv' && (
        <div className="stream-grid">
          {streams.map(s => (
            <div
              key={s.id}
              className={`stream-card ${activeStream === s.id ? 'active-stream' : ''}`}
              onClick={() => handleStreamClick(s)}
            >
              <div className="stream-thumb">
                <span className="stream-emoji">{s.emoji}</span>
                <span className="stream-live-badge">LIVE</span>
              </div>
              <div className="stream-info">
                <div className="stream-name">{s.name}</div>
                <div className="stream-league">{s.league}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sportTab === 'tv' && (
        <>
          <div className="tv-channels-header">📡 Live TV Channels</div>
          <div className="tv-grid">
            {TV_CHANNELS.map(ch => (
              <div
                key={ch.id}
                className={`tv-card ${activeStream === `tv-${ch.id}` ? 'active-stream' : ''}`}
                onClick={() => handleTvClick(ch)}
              >
                <div className="tv-logo">{ch.logo}</div>
                <div className="tv-name">{ch.name}</div>
                <div className="tv-live">● LIVE</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
