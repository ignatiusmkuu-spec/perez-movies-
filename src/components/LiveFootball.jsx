import { useState, useRef } from 'react'
import Logo from './Logo'
import './LiveFootball.css'

const PROXY_ROOT = '/soccertv/'

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
