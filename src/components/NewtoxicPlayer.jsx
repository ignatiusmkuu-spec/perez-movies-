import { useState, useEffect, useRef } from 'react'
import './NewtoxicPlayer.css'

export default function NewtoxicPlayer({ slug, type = 'movie', onError, title, poster }) {
  const videoRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [activeSeason, setActiveSeason] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [activeEp, setActiveEp] = useState(null)
  const [streamUrl, setStreamUrl] = useState(null)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    setDetail(null)
    setStreamUrl(null)

    fetch(`/api/newtoxic-detail?path=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        setDetail(data)
        if (data.type === 'movie' || type === 'movie') {
          const quals = data.qualities || []
          const fid = quals[0]?.fid
          if (fid) {
            resolveStream(fid)
          } else if (data.fid) {
            resolveStream(data.fid)
          } else {
            setError('No stream available for this title.')
            setLoading(false)
          }
        } else {
          const s = data.seasons || []
          setSeasons(s)
          if (s.length > 0) {
            setActiveSeason(s[0])
            loadEpisodes(s[0].url)
          } else {
            setError('No seasons found.')
            setLoading(false)
          }
        }
      })
      .catch(() => {
        setError('Could not load stream details.')
        setLoading(false)
      })
  }, [slug])

  const resolveStream = (fid) => {
    setResolving(true)
    setStreamUrl(`/api/newtoxic-stream?fid=${fid}`)
    setLoading(false)
    setResolving(false)
  }

  const loadEpisodes = (seasonUrl) => {
    setEpisodes([])
    setActiveEp(null)
    setStreamUrl(null)
    const path = seasonUrl.replace(/^\//, '')
    fetch(`/api/newtoxic-files?path=${encodeURIComponent(path)}`)
      .then(r => r.json())
      .then(data => {
        const files = data.files || []
        setEpisodes(files)
        setLoading(false)
      })
      .catch(() => { setEpisodes([]); setLoading(false) })
  }

  const handleSeasonSelect = (season) => {
    setActiveSeason(season)
    setLoading(true)
    loadEpisodes(season.url)
  }

  const handleEpisodeSelect = (ep) => {
    setActiveEp(ep)
    if (ep.fid) resolveStream(ep.fid)
  }

  useEffect(() => {
    if (!resolving && !loading && !streamUrl && !error) {
      const t = setTimeout(() => onError?.(), 1500)
      return () => clearTimeout(t)
    }
  }, [resolving, loading, streamUrl, error])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid || !streamUrl) return
    if (!('mediaSession' in navigator)) return

    const displayTitle = activeEp?.name || title || 'Video'
    const artwork = poster
      ? [{ src: poster, sizes: '512x512', type: 'image/jpeg' }]
      : []

    navigator.mediaSession.metadata = new MediaMetadata({
      title: displayTitle,
      artist: 'IgnatiusMovies',
      artwork,
    })

    const onPlay = () => { navigator.mediaSession.playbackState = 'playing' }
    const onPause = () => { navigator.mediaSession.playbackState = 'paused' }

    vid.addEventListener('play', onPlay)
    vid.addEventListener('pause', onPause)

    navigator.mediaSession.setActionHandler('play', () => {
      vid.play().catch(() => {})
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      vid.pause()
    })

    return () => {
      vid.removeEventListener('play', onPlay)
      vid.removeEventListener('pause', onPause)
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.metadata = null
        navigator.mediaSession.playbackState = 'none'
      }
    }
  }, [streamUrl, title, poster, activeEp])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!('mediaSession' in navigator)) return
      const vid = videoRef.current
      if (!vid) return
      navigator.mediaSession.playbackState = vid.paused ? 'paused' : 'playing'
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  if (loading || resolving) {
    return (
      <div className="ntx-loading">
        <div className="ntx-spinner" />
        <p>Loading IgnatiusMovies content…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ntx-error">
        <p>{error}</p>
        <button className="ntx-fallback-btn" onClick={onError}>Try Embed Player</button>
      </div>
    )
  }

  return (
    <div className="ntx-player">
      {streamUrl && (
        <video
          ref={videoRef}
          className="ntx-video"
          src={streamUrl}
          controls
          autoPlay
          playsInline
          onError={() => {
            setStreamUrl(null)
            setError('Stream failed to load.')
          }}
        />
      )}

      {type === 'tv' && seasons.length > 0 && (
        <div className="ntx-season-bar">
          {seasons.map(s => (
            <button
              key={s.seasonId || s.season}
              className={`ntx-season-btn ${activeSeason?.seasonId === s.seasonId ? 'active' : ''}`}
              onClick={() => handleSeasonSelect(s)}
            >
              {s.season}
            </button>
          ))}
        </div>
      )}

      {type === 'tv' && episodes.length > 0 && (
        <div className="ntx-ep-list">
          {episodes.map((ep, i) => (
            <button
              key={ep.fid || ep.name || i}
              className={`ntx-ep-btn ${activeEp?.fid === ep.fid ? 'active' : ''}`}
              onClick={() => handleEpisodeSelect(ep)}
            >
              {ep.name || `Episode ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {type === 'tv' && episodes.length === 0 && !loading && (
        <div className="ntx-no-eps">
          <p>Episodes not yet available for this season.</p>
          <button className="ntx-fallback-btn" onClick={onError}>Try Embed Player</button>
        </div>
      )}
    </div>
  )
}
