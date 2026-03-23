import { useState, useEffect, useRef } from 'react'
import './CasperPlayer.css'

const QUALITIES = [1080, 720, 480, 360]

export default function CasperPlayer({ subjectId, season, episode, onNativeError }) {
  const videoRef = useRef(null)
  const [captions, setCaptions] = useState([])
  const [captionsLoading, setCaptionsLoading] = useState(true)
  const [quality, setQuality] = useState(720)
  const [activeLang, setActiveLang] = useState('en')
  const [showSubs, setShowSubs] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [videoError, setVideoError] = useState(false)

  const episodeParams = season && episode ? `&se=${season}&ep=${episode}` : ''
  const streamUrl = `https://movieapi.xcasper.space/api/bff/stream?subjectId=${subjectId}&resolution=${quality}${episodeParams}`

  useEffect(() => {
    if (!subjectId) return
    setCaptionsLoading(true)
    setCaptions([])
    const tvParams = season && episode ? `&se=${season}&ep=${episode}` : ''
    fetch(`/api/casper-captions?subjectId=${subjectId}${tvParams}`)
      .then(r => r.json())
      .then(data => {
        const tracks = data.captions || []
        setCaptions(tracks)
        const hasEn = tracks.some(t => t.lan === 'en')
        setActiveLang(hasEn ? 'en' : (tracks[0]?.lan || ''))
      })
      .catch(() => {})
      .finally(() => setCaptionsLoading(false))
  }, [subjectId])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    Array.from(vid.textTracks).forEach(track => {
      track.mode = track.language === activeLang ? 'showing' : 'hidden'
    })
  }, [activeLang, captions])

  const handleQualityChange = (q) => {
    const vid = videoRef.current
    const currentTime = vid?.currentTime || 0
    const paused = vid?.paused ?? true
    setQuality(q)
    setShowQuality(false)
    setTimeout(() => {
      if (vid) {
        vid.currentTime = currentTime
        if (!paused) vid.play().catch(() => {})
      }
    }, 150)
  }

  const handleLangChange = (lan) => {
    setActiveLang(lan)
    setShowSubs(false)
  }

  if (videoError) {
    return (
      <div className="cp-error">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>Native player could not load this stream.</p>
        <button className="cp-fallback-btn" onClick={onNativeError}>
          Switch to Embed Player
        </button>
      </div>
    )
  }

  return (
    <div className="cp-root">
      <video
        ref={videoRef}
        className="cp-video"
        controls
        autoPlay
        crossOrigin="anonymous"
        src={streamUrl}
        key={`${subjectId}-${quality}`}
        onError={() => setVideoError(true)}
      >
        {captions.map(cap => (
          <track
            key={cap.id}
            kind="subtitles"
            src={`/api/casper-vtt?url=${encodeURIComponent(cap.url)}`}
            srcLang={cap.lan}
            label={cap.lanName}
            default={cap.lan === 'en'}
          />
        ))}
      </video>

      <div className="cp-toolbar">
        <div className="cp-toolbar-left">
          <div className="cp-pill cp-quality-pill">
            <button
              className="cp-pill-btn"
              onClick={() => { setShowQuality(s => !s); setShowSubs(false) }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              {quality}p
            </button>
            {showQuality && (
              <div className="cp-dropdown">
                {QUALITIES.map(q => (
                  <button
                    key={q}
                    className={`cp-dd-item ${q === quality ? 'cp-dd-active' : ''}`}
                    onClick={() => handleQualityChange(q)}
                  >{q}p</button>
                ))}
              </div>
            )}
          </div>

          <div className="cp-pill cp-subs-pill">
            <button
              className={`cp-pill-btn ${activeLang ? 'cp-pill-active' : ''}`}
              onClick={() => { setShowSubs(s => !s); setShowQuality(false) }}
              disabled={captionsLoading || captions.length === 0}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="6" y1="16" x2="12" y2="16"/></svg>
              {captionsLoading
                ? 'Subtitles…'
                : captions.length === 0
                  ? 'No Subs'
                  : (captions.find(c => c.lan === activeLang)?.lanName || 'Subtitles')}
            </button>
            {showSubs && captions.length > 0 && (
              <div className="cp-dropdown cp-subs-dropdown">
                <button
                  className={`cp-dd-item ${!activeLang ? 'cp-dd-active' : ''}`}
                  onClick={() => handleLangChange('')}
                >Off</button>
                {captions.map(cap => (
                  <button
                    key={cap.id}
                    className={`cp-dd-item ${cap.lan === activeLang ? 'cp-dd-active' : ''}`}
                    onClick={() => handleLangChange(cap.lan)}
                  >
                    {cap.lanName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="cp-toolbar-right">
          <span className="cp-badge">CasperStream</span>
          {captions.length > 0 && (
            <span className="cp-subs-count">{captions.length} subtitle{captions.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  )
}
