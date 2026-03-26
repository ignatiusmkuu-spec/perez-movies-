import { useRadio } from '../context/RadioContext'
import './RadioMiniPlayer.css'

function StationArt({ station }) {
  const initials = station.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const hue = Math.abs(station.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360
  const bg = `linear-gradient(135deg, hsl(${hue},70%,35%), hsl(${(hue+40)%360},70%,25%))`

  return (
    <div className="rmp-art" style={{ background: bg }}>
      {station.favicon ? (
        <img
          src={station.favicon}
          alt=""
          className="rmp-art-img"
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
        />
      ) : null}
      <span className="rmp-art-initials" style={{ display: station.favicon ? 'none' : 'flex' }}>
        {initials}
      </span>
    </div>
  )
}

function Equalizer() {
  return (
    <div className="rmp-eq">
      <span /><span /><span /><span /><span />
    </div>
  )
}

export default function RadioMiniPlayer() {
  const { playing, audioLoading, audioError, volume, muted, stopPlaying, toggleMute, handleVolume } = useRadio()

  if (!playing) return null

  const tags = playing.tags ? playing.tags.split(',').slice(0, 2).map(t => t.trim()).filter(Boolean) : []
  const meta = [playing.country, playing.bitrate ? `${playing.bitrate}kbps` : null, playing.codec].filter(Boolean)

  return (
    <div className="rmp-bar">
      <div className="rmp-glow" />

      <StationArt station={playing} />

      <div className="rmp-center">
        <div className="rmp-top-row">
          <span className="rmp-live-pill">
            <span className="rmp-live-dot" />
            LIVE
          </span>
          {audioLoading
            ? <span className="rmp-spinner" />
            : <Equalizer />
          }
          <span className="rmp-name">{playing.name}</span>
        </div>
        {meta.length > 0 && (
          <div className="rmp-meta">
            {meta.map((m, i) => (
              <span key={i} className="rmp-meta-item">{m}</span>
            ))}
            {tags.map((t, i) => (
              <span key={`t${i}`} className="rmp-tag">{t}</span>
            ))}
          </div>
        )}
        {audioError && <div className="rmp-error">{audioError}</div>}
      </div>

      <div className="rmp-controls">
        <button className="rmp-mute-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
          {muted
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            : volume > 0.5
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          }
        </button>
        <div className="rmp-vol-wrap">
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={muted ? 0 : volume}
            onChange={e => handleVolume(parseFloat(e.target.value))}
            className="rmp-vol-slider"
            style={{ '--vol': `${(muted ? 0 : volume) * 100}%` }}
          />
        </div>
        <button className="rmp-stop-btn" onClick={stopPlaying} title="Stop playback">
          <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
