import { useRadio } from '../context/RadioContext'
import './RadioMiniPlayer.css'

export default function RadioMiniPlayer() {
  const { playing, audioLoading, audioError, volume, muted, stopPlaying, toggleMute, handleVolume } = useRadio()

  if (!playing) return null

  return (
    <div className="rmp-bar">
      <div className="rmp-left">
        <div className="rmp-wave-wrap">
          {audioLoading
            ? <span className="rmp-spinner" />
            : (
              <span className="rmp-wave">
                <span /><span /><span /><span />
              </span>
            )
          }
        </div>
        <div className="rmp-info">
          <span className="rmp-live-badge">LIVE</span>
          <span className="rmp-name">{playing.name}</span>
        </div>
      </div>

      <div className="rmp-controls">
        <button className="rmp-vol-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : volume}
          onChange={e => handleVolume(parseFloat(e.target.value))}
          className="rmp-vol-slider"
        />
        <button className="rmp-stop-btn" onClick={stopPlaying} title="Stop">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <rect x="5" y="5" width="14" height="14" rx="1" />
          </svg>
          Stop
        </button>
      </div>

      {audioError && <div className="rmp-error">{audioError}</div>}
    </div>
  )
}
