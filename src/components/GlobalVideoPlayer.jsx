import { useRef } from 'react'
import { useVideoPlayer } from '../context/VideoPlayerContext'
import './GlobalVideoPlayer.css'

export default function GlobalVideoPlayer() {
  const { video, mode, minimize, expand, close } = useVideoPlayer()
  const iframeRef = useRef(null)

  if (!video || mode === 'none') return null

  const isMini = mode === 'mini'
  const isFull = mode === 'full'

  const TypeIcon = () => {
    if (video.type === 'youtube') return <span className="gvp-type-icon yt">▶</span>
    if (video.type === 'radio')   return <span className="gvp-type-icon rd">📻</span>
    return <span className="gvp-type-icon mv">🎬</span>
  }

  return (
    <>
      {isFull && <div className="gvp-backdrop" onClick={minimize} />}

      <div className={`gvp-container ${isMini ? 'gvp-mini' : 'gvp-full'}`}>
        <div className="gvp-titlebar">
          <div className="gvp-title-left">
            <TypeIcon />
            <span className="gvp-title">{video.title}</span>
            {video.channel && <span className="gvp-channel">· {video.channel}</span>}
          </div>
          <div className="gvp-title-actions">
            {isMini ? (
              <button className="gvp-btn" onClick={expand} title="Expand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
                </svg>
              </button>
            ) : (
              <button className="gvp-btn" onClick={minimize} title="Minimize to PiP">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                  <rect x="14" y="14" width="8" height="6" rx="1"/><path d="M2 3h13v10H2z"/>
                </svg>
              </button>
            )}
            <button className="gvp-btn gvp-close-btn" onClick={close} title="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="gvp-frame-wrap">
          <iframe
            ref={iframeRef}
            src={video.embedUrl}
            className="gvp-iframe"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
            referrerPolicy="no-referrer-when-downgrade"
            title={video.title}
          />
        </div>
      </div>
    </>
  )
}
