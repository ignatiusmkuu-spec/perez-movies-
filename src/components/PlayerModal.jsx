import { useState, useEffect } from 'react'
import { fetchDownloads, groupByQuality } from '../api/download'
import './PlayerModal.css'

const MB_BASE = 'https://123movienow.cc'

function makePlayerUrl(mbId, detailPath, isTV, season, episode) {
  if (!mbId || !detailPath) return null
  if (isTV) {
    return `${MB_BASE}/spa/videoPlayPage/tv/${detailPath}?id=${mbId}&type=/tv/detail&detailSe=${season}&detailEp=${episode}&lang=en`
  }
  return `${MB_BASE}/spa/videoPlayPage/movies/${detailPath}?id=${mbId}&type=/movie/detail&detailSe=&detailEp=&lang=en`
}

async function searchMovieBox(title, isTV) {
  try {
    const type = isTV ? 'tv' : 'movie'
    const res = await fetch(`/api/moviebox-search?q=${encodeURIComponent(title)}&type=${type}`, {
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    if (data.mbId && data.detailPath) return data
    return null
  } catch {
    return null
  }
}

const ANIME_LINKS = [
  { label: 'HiAnime',    url: (t) => `https://hianime.to/search?keyword=${encodeURIComponent(t)}` },
  { label: 'AniWatch',   url: (t) => `https://aniwatch.to/search?keyword=${encodeURIComponent(t)}` },
  { label: 'GogoAnime',  url: (t) => `https://gogoanime3.co/search.html?keyword=${encodeURIComponent(t)}` },
  { label: 'Crunchyroll', url: (t) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}` },
]

const MAX_EPISODES = 30
const MAX_SEASONS  = 15

export default function PlayerModal({ item, type, onClose }) {
  const [season, setSeason]           = useState(1)
  const [episode, setEpisode]         = useState(1)
  const [visible, setVisible]         = useState(false)
  const [showEpPanel, setShowEpPanel] = useState(false)
  const [showDlPanel, setShowDlPanel] = useState(false)
  const [dlLoading, setDlLoading]     = useState(false)
  const [dlGroups, setDlGroups]       = useState(null)
  const [dlError, setDlError]         = useState(null)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [mbId, setMbId]               = useState(null)
  const [detailPath, setDetailPath]   = useState(null)
  const [lookingUp, setLookingUp]     = useState(false)
  const [imdbId, setImdbId]           = useState(null)

  const isAnime = type === 'anime'
  const isTV    = type === 'moviebox-tv' || type === 'tv'

  let title, year
  if (isAnime) {
    title = item.title_english || item.title || item.Title || ''
    year  = item.year || item.Year
  } else if (isTV) {
    title = item.name || item.Title || item.title
    year  = item.premiered?.slice(0,4) || item.Year || item.releaseDate?.slice(0,4)
  } else {
    title = item.Title || item.title || item.name
    year  = item.Year || item.releaseDate?.slice(0,4) || item.premiered?.slice(0,4)
  }

  const showEps  = isTV || (isAnime && mbId)
  const embedUrl = makePlayerUrl(mbId, detailPath, isTV || isAnime, season, episode)

  useEffect(() => {
    setMbId(null)
    setDetailPath(null)
    setImdbId(null)
    setSeason(1)
    setEpisode(1)
    setShowDlPanel(false)
    setDlGroups(null)
    setDlError(null)
    setIframeLoading(true)

    if (item._mbId && item._detailPath) {
      setMbId(item._mbId)
      setDetailPath(item._detailPath)
      if (item.imdbID) setImdbId(item.imdbID)
      return
    }

    if (item.imdbID) setImdbId(item.imdbID)

    if (title) {
      setLookingUp(true)
      searchMovieBox(title, isTV || isAnime).then(result => {
        if (result) {
          setMbId(result.mbId)
          setDetailPath(result.detailPath)
        }
        setLookingUp(false)
      })
    }
  }, [item])

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
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
    setIframeLoading(true)
  }, [season, episode, mbId])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const changeEpisode = (ep) => {
    setEpisode(ep)
    setDlGroups(null)
    setDlError(null)
  }

  const changeSeason = (s) => {
    setSeason(s)
    setEpisode(1)
    setDlGroups(null)
    setDlError(null)
  }

  const openDownloads = async () => {
    setShowDlPanel(true)
    setShowEpPanel(false)
    if (dlGroups !== null) return
    setDlLoading(true)
    setDlError(null)
    try {
      const mediaType = isTV || isAnime ? 'tv' : 'movie'
      const data = await fetchDownloads({
        title,
        year,
        imdb: imdbId,
        type: mediaType,
        season: showEps ? season : undefined,
        episode: showEps ? episode : undefined,
      })
      setDlGroups(groupByQuality(data.results || []))
    } catch {
      setDlError('Could not load downloads. Try again.')
    } finally {
      setDlLoading(false)
    }
  }

  return (
    <div className={`mb-overlay ${visible ? 'mb-visible' : ''}`}>
      <div className="mb-layout">

        <div className="mb-top-bar">
          <button className="mb-back-btn" onClick={handleClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            <span>Back</span>
          </button>
          <div className="mb-top-title">
            <span className="mb-title-name">{title}</span>
            {year && <span className="mb-title-badge">{year}</span>}
            {showEps && <span className="mb-title-badge mb-ep-badge">S{season} · E{episode}</span>}
          </div>
          {showEps && (
            <button className="mb-ep-toggle-btn" onClick={() => setShowEpPanel(p => !p)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
              Episodes
            </button>
          )}
        </div>

        <div className="mb-main">
          <div className="mb-screen">

            {lookingUp && (
              <div className="mb-loader">
                <div className="mb-spinner" />
                <p className="mb-loader-text">Finding stream…</p>
              </div>
            )}

            {!lookingUp && iframeLoading && embedUrl && (
              <div className="mb-loader">
                <div className="mb-spinner" />
                <p className="mb-loader-text">Loading player…</p>
              </div>
            )}

            {!lookingUp && embedUrl ? (
              <iframe
                key={`${mbId}-${season}-${episode}`}
                className={`mb-iframe ${iframeLoading ? 'mb-iframe-hidden' : ''}`}
                src={embedUrl}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setIframeLoading(false)}
              />
            ) : !lookingUp && isAnime && !mbId ? (
              <div className="mb-fallback">
                <div className="mb-fallback-title">Watch "{title}" on:</div>
                <div className="mb-link-grid">
                  {ANIME_LINKS.map((s, i) => (
                    <a key={i} href={s.url(title)} target="_blank" rel="noreferrer" className="mb-ext-btn">
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : !lookingUp && !mbId ? (
              <div className="mb-fallback">
                <div className="mb-fallback-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3ba776" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p>Stream not found for "<strong>{title}</strong>"</p>
              </div>
            ) : null}

            {showDlPanel && (
              <div className="mb-ep-panel">
                <div className="mb-ep-panel-header">
                  <span>Download</span>
                  <button className="mb-ep-panel-close" onClick={() => setShowDlPanel(false)}>✕</button>
                </div>
                {dlLoading && (
                  <div className="mb-dl-loading">
                    <div className="mb-spinner" style={{ width: 32, height: 32, borderWidth: 2 }} />
                    <span>Searching torrents…</span>
                  </div>
                )}
                {dlError && <div className="mb-dl-error">{dlError}</div>}
                {!dlLoading && dlGroups !== null && dlGroups.length === 0 && (
                  <div className="mb-dl-empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3ba776" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>No downloads found for "{title}"</p>
                    <div className="mb-dl-fallback-links">
                      <a href={`https://yts.mx/browse-movies/${encodeURIComponent(title)}`} target="_blank" rel="noreferrer" className="mb-ext-btn">YTS Movies</a>
                      <a href={`https://nyaa.si/?q=${encodeURIComponent(title)}`} target="_blank" rel="noreferrer" className="mb-ext-btn">Nyaa Anime</a>
                    </div>
                  </div>
                )}
                {!dlLoading && dlGroups !== null && dlGroups.length > 0 && (
                  <div className="mb-dl-groups">
                    {dlGroups.map(({ quality, items }) => (
                      <div key={quality} className="mb-dl-group">
                        <div className="mb-dl-quality-label">
                          <span className="mb-dl-badge">{quality}</span>
                          <span className="mb-dl-count">{items.length} result{items.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="mb-dl-items">
                          {items.map((it, i) => (
                            <div key={i} className="mb-dl-item">
                              <div className="mb-dl-item-name">{it.name}</div>
                              <div className="mb-dl-item-meta">
                                <span className="mb-dl-size">{it.size}</span>
                                <span className="mb-dl-seeds">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#3ba776"><circle cx="12" cy="12" r="10"/></svg>
                                  {it.seeders} seeds
                                </span>
                              </div>
                              <a href={it.magnet} className="mb-dl-magnet-btn" title="Open with torrent client">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Magnet Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="mb-dl-note">Downloads open in your torrent client (qBittorrent, uTorrent, etc.)</div>
                  </div>
                )}
              </div>
            )}

            {showEpPanel && showEps && (
              <div className="mb-ep-panel">
                <div className="mb-ep-panel-header">
                  <span>Season</span>
                  <button className="mb-ep-panel-close" onClick={() => setShowEpPanel(false)}>✕</button>
                </div>
                <div className="mb-season-tabs">
                  {Array.from({ length: MAX_SEASONS }, (_, i) => i + 1).map(s => (
                    <button
                      key={s}
                      className={`mb-season-tab ${season === s ? 'mb-season-active' : ''}`}
                      onClick={() => changeSeason(s)}
                    >S{s}</button>
                  ))}
                </div>
                <div className="mb-ep-panel-header" style={{ marginTop: 14 }}>
                  <span>Episode</span>
                </div>
                <div className="mb-ep-grid">
                  {Array.from({ length: MAX_EPISODES }, (_, i) => i + 1).map(ep => (
                    <button
                      key={ep}
                      className={`mb-ep-num ${episode === ep ? 'mb-ep-active' : ''}`}
                      onClick={() => { changeEpisode(ep); setShowEpPanel(false) }}
                    >{ep}</button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="mb-bottom-bar">
          <div className="mb-action-row">
            {embedUrl && (
              <a className="mb-action-link" href={embedUrl} target="_blank" rel="noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open in Tab
              </a>
            )}
            {imdbId?.startsWith?.('tt') && (
              <a className="mb-action-link" href={`https://www.imdb.com/title/${imdbId}/`} target="_blank" rel="noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                IMDB
              </a>
            )}
            {title && (
              <button
                className={`mb-action-link mb-dl-trigger ${showDlPanel ? 'mb-dl-active' : ''}`}
                onClick={openDownloads}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
