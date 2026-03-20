import { useState, useRef } from 'react'
import './LiveSports.css'

const SPORTS_STREAMS = [
  {
    id: 'cricfy',
    name: 'Cricfy TV',
    emoji: '🏏',
    color: '#e87c0c',
    description: 'Live Cricket & Sports',
    url: '/stream-proxy?target=https://cricfy.pro/',
  },
  {
    id: 'cricfy-apk',
    name: 'Cricfy APK',
    emoji: '📱',
    color: '#e87c0c',
    description: 'Download & Info',
    url: '/stream-proxy?target=https://cricfy.pro/apk/',
  },
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
  { id: 9,  name: 'SuperSport PSL',      emoji: '⚡', color: '#1a1a5e', url: 'https://supersport.com/live/' },
  { id: 10, name: 'Canal+ Sport',        emoji: '🎬', color: '#000000', url: 'https://www.mycanal.fr/' },
  { id: 11, name: 'Sky Sports PL',       emoji: '🌤', color: '#00b2ff', url: 'https://www.skysports.com/watch' },
  { id: 12, name: 'beIN Sports HD2',     emoji: '📺', color: '#004b87', url: 'https://www.beinsports.com/en/' },
]

export default function LiveSports() {
  const [tab, setTab] = useState('cricfy')
  const [activeStream, setActiveStream] = useState(SPORTS_STREAMS[0])
  const [frameLoading, setFrameLoading] = useState(true)
  const iframeRef = useRef(null)

  const handleStreamSelect = (stream) => {
    setActiveStream(stream)
    setFrameLoading(true)
  }

  return (
    <div className="sports-section">
      <div className="sports-header">
        <div className="live-dot" />
        <h2>Live Sports</h2>
        <span className="live-label">LIVE</span>
      </div>

      <div className="sports-tabs">
        <button className={`sport-tab ${tab === 'cricfy' ? 'active' : ''}`} onClick={() => setTab('cricfy')}>
          🏏 Cricfy TV
        </button>
        <button className={`sport-tab ${tab === 'channels' ? 'active' : ''}`} onClick={() => setTab('channels')}>
          📡 Live Channels
        </button>
      </div>

      {tab === 'cricfy' && (
        <div className="cricfy-section">
          <div className="cricfy-stream-tabs">
            {SPORTS_STREAMS.map(s => (
              <button
                key={s.id}
                className={`cricfy-tab ${activeStream.id === s.id ? 'active' : ''}`}
                onClick={() => handleStreamSelect(s)}
                style={{ '--stream-color': s.color }}
              >
                <span className="cricfy-tab-emoji">{s.emoji}</span>
                <span className="cricfy-tab-name">{s.name}</span>
                <span className="cricfy-tab-desc">{s.description}</span>
              </button>
            ))}
          </div>

          <div className="cricfy-player-wrap">
            <div className="cricfy-player-header">
              <span className="cricfy-player-emoji">{activeStream.emoji}</span>
              <div>
                <div className="cricfy-player-title">{activeStream.name}</div>
                <div className="cricfy-player-desc">{activeStream.description}</div>
              </div>
              <div className="cricfy-live-pill">
                <span className="cricfy-live-dot" />
                LIVE
              </div>
            </div>

            <div className="cricfy-iframe-wrap">
              {frameLoading && (
                <div className="cricfy-loading">
                  <div className="spinner" />
                  <p>Loading Cricfy TV...</p>
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={activeStream.url}
                src={activeStream.url}
                className="cricfy-iframe"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setFrameLoading(false)}
                title={activeStream.name}
              />
            </div>

            <div className="cricfy-actions">
              <a
                href="https://cricfy.pro/"
                target="_blank"
                rel="noreferrer"
                className="cricfy-action-btn primary"
              >
                🔗 Open Cricfy TV
              </a>
              <a
                href="https://cricfy.pro/apk/"
                target="_blank"
                rel="noreferrer"
                className="cricfy-action-btn secondary"
              >
                📲 Download APK
              </a>
            </div>
          </div>

          <div className="cricfy-info-cards">
            <div className="cricfy-info-card">
              <div className="cricfy-info-icon">🏏</div>
              <div className="cricfy-info-text">
                <div className="cricfy-info-title">Live Cricket</div>
                <div className="cricfy-info-desc">IPL, T20 World Cup, Test Matches & more</div>
              </div>
            </div>
            <div className="cricfy-info-card">
              <div className="cricfy-info-icon">⚽</div>
              <div className="cricfy-info-text">
                <div className="cricfy-info-title">Football Streams</div>
                <div className="cricfy-info-desc">Premier League, Champions League & more</div>
              </div>
            </div>
            <div className="cricfy-info-card">
              <div className="cricfy-info-icon">📱</div>
              <div className="cricfy-info-text">
                <div className="cricfy-info-title">Mobile App</div>
                <div className="cricfy-info-desc">Free APK for Android — no subscription</div>
              </div>
            </div>
            <div className="cricfy-info-card">
              <div className="cricfy-info-icon">🆓</div>
              <div className="cricfy-info-text">
                <div className="cricfy-info-title">100% Free</div>
                <div className="cricfy-info-desc">No sign-up, no login required</div>
              </div>
            </div>
          </div>
        </div>
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
