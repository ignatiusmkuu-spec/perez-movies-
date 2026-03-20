import { useState, useRef, useEffect, useCallback } from 'react'
import { getImdbId } from '../api/moviebox'
import './PlayerModal.css'

const MOVIE_SOURCES = [
  { label: 'Server 1',  getUrl: (id) => `https://vidsrc.net/embed/movie?imdb=${id}` },
  { label: 'Server 2',  getUrl: (id) => `https://vidlink.pro/movie/${id}` },
  { label: 'Server 3',  getUrl: (id) => `https://www.2embed.cc/embed/${id}` },
  { label: 'Server 4',  getUrl: (id) => `https://multiembed.mov/?video_id=${id}` },
  { label: 'Server 5',  getUrl: (id) => `https://embed.smashystream.com/playere.php?imdb=${id}` },
  { label: 'Server 6',  getUrl: (id) => `https://vidsrc.me/embed/movie?imdb=${id}` },
  { label: 'Server 7',  getUrl: (id) => `https://123movienow.cc/embed/movie/${id}` },
]

const TV_SOURCES = [
  { label: 'Server 1',  getUrl: (id, s, e) => `https://vidsrc.net/embed/tv?imdb=${id}&season=${s}&episode=${e}` },
  { label: 'Server 2',  getUrl: (id, s, e) => `https://www.2embed.cc/embedtvfull/${id}&s=${s}&e=${e}` },
  { label: 'Server 3',  getUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&s=${s}&e=${e}` },
  { label: 'Server 4',  getUrl: (id, s, e) => `https://embed.smashystream.com/playere.php?imdb=${id}&s=${s}&e=${e}` },
  { label: 'Server 5',  getUrl: (id, s, e) => `https://vidsrc.me/embed/tv?imdb=${id}&season=${s}&episode=${e}` },
  { label: 'Server 6',  getUrl: (id, s, e) => `https://123movienow.cc/embed/tv/${id}/${s}/${e}` },
]

const ANIME_LINKS = [
  { label: 'HiAnime',    url: (t) => `https://hianime.to/search?keyword=${encodeURIComponent(t)}` },
  { label: 'AniWatch',   url: (t) => `https://aniwatch.to/search?keyword=${encodeURIComponent(t)}` },
  { label: 'GogoAnime',  url: (t) => `https://gogoanime3.co/search.html?keyword=${encodeURIComponent(t)}` },
  { label: 'Crunchyroll', url: (t) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}` },
]

export default function PlayerModal({ item, type, onClose }) {
  const [srcIdx, setSrcIdx]           = useState(0)
  const [loading, setLoading]         = useState(true)
  const [season, setSeason]           = useState(1)
  const [episode, setEpisode]         = useState(1)
  const [resolvedImdb, setResolvedImdb] = useState(null)
  const [lookingUp, setLookingUp]     = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [visible, setVisible]         = useState(false)
  const hideTimer = useRef(null)
  const iframeRef = useRef()

  const isAnime = type === 'anime'
  const isTV    = type === 'moviebox-tv' || type === 'tv'
  const needsLookup = item?._source === 'moviebox' || item?._mbId || item?._source === 'flixer' || isAnime

  const animeTitle = isAnime ? (item.title_english || item.title || item.Title || '') : ''

  let sources, id, title, year
  if (isAnime) {
    sources = resolvedImdb ? TV_SOURCES : null
    id = resolvedImdb || ''
    title = animeTitle
    year = item.year || item.Year
  } else if (isTV) {
    sources = TV_SOURCES
    id = resolvedImdb || item.externals?.imdb || item.imdbID || ''
    title = item.name || item.Title || item.title
    year = item.premiered?.slice(0, 4) || item.Year || item.releaseDate?.slice(0, 4)
  } else {
    sources = MOVIE_SOURCES
    id = resolvedImdb || item.imdbID || ''
    title = item.Title || item.title || item.name
    year = item.Year || item.releaseDate?.slice(0, 4) || item.premiered?.slice(0, 4)
  }

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    return () => clearTimeout(hideTimer.current)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setResolvedImdb(null)
    setSrcIdx(0)
    setLoading(true)
    if (item.imdbID && !isAnime) { setResolvedImdb(item.imdbID); return }
    if (item.externals?.imdb && isTV) { setResolvedImdb(item.externals.imdb); return }
    if (needsLookup && !item.imdbID) {
      const lt = isAnime ? animeTitle : (item.Title || item.title)
      const ly = isAnime ? year : (item.Year || item.releaseDate?.slice(0, 4))
      const isSeries = isTV || isAnime || item._mbType === 2
      if (!lt) return
      setLookingUp(true)
      getImdbId(lt, ly, isSeries).then(f => { if (f) setResolvedImdb(f); setLookingUp(false) })
    }
  }, [item])

  const revealControls = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3500)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const showEps = isTV || (isAnime && resolvedImdb)
  const src = sources?.[srcIdx]
  const embedUrl = id && src ? src.getUrl(id, season, episode) : null

  return (
    <div
      className={`nf-overlay ${visible ? 'nf-visible' : ''}`}
      onMouseMove={revealControls}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="nf-player">

        <div className={`nf-top-bar ${showControls ? 'controls-visible' : ''}`}>
          <button className="nf-back-btn" onClick={handleClose}>
            <span className="nf-back-arrow">‹</span>
            <span className="nf-back-label">Back</span>
          </button>
          <div className="nf-top-title">
            <span className="nf-title-text">{title}</span>
            {year && <span className="nf-title-year">{year}</span>}
            {showEps && <span className="nf-title-ep">S{season} · E{episode}</span>}
          </div>
        </div>

        <div className="nf-screen">
          {(loading || lookingUp) && (
            <div className="nf-loader">
              <div className="nf-spinner">
                <div className="nf-spinner-arc" />
              </div>
              <p className="nf-loader-text">
                {lookingUp ? 'Finding stream…' : 'Loading…'}
              </p>
            </div>
          )}

          {!lookingUp && embedUrl ? (
            <iframe
              ref={iframeRef}
              key={`${srcIdx}-${id}-${season}-${episode}`}
              className="nf-iframe"
              src={embedUrl}
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setLoading(false)}
            />
          ) : !lookingUp && isAnime && !resolvedImdb ? (
            <div className="nf-fallback">
              <div className="nf-fallback-title">Watch "{animeTitle}" on:</div>
              <div className="nf-anime-grid">
                {ANIME_LINKS.map((s, i) => (
                  <a key={i} href={s.url(animeTitle)} target="_blank" rel="noreferrer" className="nf-anime-btn">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          ) : !lookingUp && !id ? (
            <div className="nf-fallback">
              <p>Stream not found for "{title}"</p>
              <p style={{ fontSize: '0.8rem', marginTop: 8, opacity: 0.6 }}>Try switching servers below</p>
            </div>
          ) : null}
        </div>

        <div className={`nf-bottom-bar ${showControls ? 'controls-visible' : ''}`}>
          {showEps && (
            <div className="nf-ep-row">
              <div className="nf-ep-group">
                <span className="nf-ep-label">Season</span>
                <div className="nf-ep-controls">
                  <button className="nf-ep-btn" onClick={() => { setSeason(s => Math.max(1, s - 1)); setLoading(true) }}>−</button>
                  <span className="nf-ep-val">{season}</span>
                  <button className="nf-ep-btn" onClick={() => { setSeason(s => s + 1); setLoading(true) }}>+</button>
                </div>
              </div>
              <div className="nf-ep-group">
                <span className="nf-ep-label">Episode</span>
                <div className="nf-ep-controls">
                  <button className="nf-ep-btn" onClick={() => { setEpisode(e => Math.max(1, e - 1)); setLoading(true) }}>−</button>
                  <span className="nf-ep-val">{episode}</span>
                  <button className="nf-ep-btn" onClick={() => { setEpisode(e => e + 1); setLoading(true) }}>+</button>
                </div>
              </div>
            </div>
          )}

          {sources && (
            <div className="nf-servers">
              <span className="nf-servers-label">Servers</span>
              <div className="nf-server-list">
                {sources.map((s, i) => (
                  <button
                    key={i}
                    className={`nf-server-btn ${srcIdx === i ? 'nf-server-active' : ''}`}
                    onClick={() => { setSrcIdx(i); setLoading(true) }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="nf-action-row">
            {embedUrl && (
              <a className="nf-action-link" href={embedUrl} target="_blank" rel="noreferrer">
                ↗ New Tab
              </a>
            )}
            {id?.startsWith?.('tt') && (
              <a className="nf-action-link" href={`https://www.imdb.com/title/${id}/`} target="_blank" rel="noreferrer">
                ★ IMDB
              </a>
            )}
            {title && (
              <a className="nf-action-link" href={`https://yts.mx/browse-movies/${encodeURIComponent(title)}`} target="_blank" rel="noreferrer">
                ⬇ Download
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
