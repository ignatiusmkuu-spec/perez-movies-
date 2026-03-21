import { useState, useRef, useEffect, useCallback } from 'react'
import { getImdbId } from '../api/moviebox'
import { fetchDownloads, groupByQuality } from '../api/download'
import './PlayerModal.css'

const MB_DOMAIN_URL = '/proxy/moviebox-domain'

async function fetchMovieBoxDomain() {
  try {
    const res = await fetch(MB_DOMAIN_URL)
    if (!res.ok) throw new Error('bad')
    const json = await res.json()
    const raw = json?.data || 'https://123movienow.cc'
    return raw.replace(/\/+$/, '')
  } catch {
    return 'https://123movienow.cc'
  }
}

function makeSources(domain) {
  const d = domain || 'https://123movienow.cc'
  return {
    movie: [
      { label: 'Server 1',      icon: '▶', hd: true,  getUrl: (id)     => `${d}/embed/movie/${id}` },
      { label: 'AutoEmbed',     icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://autoembed.co/movie/imdb/${id}` },
      { label: 'Videasy 4K',    icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://player.videasy.net/movie/${id}?colour=e50914` },
      { label: 'VidSrc RIP',    icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://vidsrc.rip/embed/movie/${id}` },
      { label: 'VidLink',       icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://vidlink.pro/movie/${id}?primaryColor=e50914` },
      { label: 'MultiEmbed',    icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://multiembed.mov/directstream.php?video_id=${id}&imdb=1` },
      { label: '2Embed',        icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://www.2embed.cc/embed/${id}` },
      { label: 'VidSrc XYZ',   icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://vidsrc.xyz/embed/movie?imdb=${id}` },
      { label: 'VidSrc TO',     icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://vidsrc.to/embed/movie/${id}` },
      { label: 'VidFast',       icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://vidfast.pro/movie/${id}?autoPlay=true` },
      { label: 'SmashyStream',  icon: '▶', hd: false, named: true, getUrl: (id)     => `https://embed.smashystream.com/playere.php?imdb=${id}` },
      { label: 'VidSrc ME',     icon: '▶', hd: false, named: true, getUrl: (id)     => `https://vidsrc.me/embed/movie?imdb=${id}` },
      { label: 'MoviesAPI',     icon: '▶', hd: false, named: true, getUrl: (id)     => `https://moviesapi.club/movie/${id}` },
      { label: 'VidBinge',      icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://vidbinge.dev/embed/movie/${id}` },
      { label: 'SmashyPlayer',  icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://player.smashy.stream/movie/${id}` },
      { label: 'VidSrc Net',    icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://vidsrc.net/embed/movie/${id}` },
      { label: 'Frembed',       icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://frembed.pro/api/film.php?id=${id}` },
      { label: '2Embed Skin',   icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://2embed.skin/embed/movie/${id}` },
      { label: 'Embeds XYZ',    icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://embeds.xyz/embed/${id}` },
      { label: '2Embed Org',    icon: '▶', hd: true,  named: true, getUrl: (id)     => `https://2embed.org/embed/movie/${id}` },
    ],
    tv: [
      { label: 'Server 1',      icon: '▶', hd: true,  getUrl: (id,s,e) => `${d}/embed/tv/${id}/${s}/${e}` },
      { label: 'AutoEmbed',     icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://autoembed.co/tv/imdb/${id}/${s}/${e}` },
      { label: 'Videasy 4K',    icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://player.videasy.net/tv/${id}/${s}/${e}?colour=e50914` },
      { label: 'VidSrc RIP',    icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://vidsrc.rip/embed/tv/${id}?season=${s}&episode=${e}` },
      { label: 'VidLink',       icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914` },
      { label: 'MultiEmbed',    icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://multiembed.mov/directstream.php?video_id=${id}&imdb=1&s=${s}&e=${e}` },
      { label: '2Embed',        icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` },
      { label: 'VidSrc XYZ',   icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://vidsrc.xyz/embed/tv?imdb=${id}&season=${s}&episode=${e}` },
      { label: 'VidSrc TO',     icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
      { label: 'VidFast',       icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true` },
      { label: 'SmashyStream',  icon: '▶', hd: false, named: true, getUrl: (id,s,e) => `https://embed.smashystream.com/playere.php?imdb=${id}&s=${s}&e=${e}` },
      { label: 'VidSrc ME',     icon: '▶', hd: false, named: true, getUrl: (id,s,e) => `https://vidsrc.me/embed/tv?imdb=${id}&season=${s}&episode=${e}` },
      { label: 'MoviesAPI',     icon: '▶', hd: false, named: true, getUrl: (id,s,e) => `https://moviesapi.club/tv/${id}-${s}-${e}` },
      { label: 'VidBinge',      icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://vidbinge.dev/embed/tv/${id}/${s}/${e}` },
      { label: 'SmashyPlayer',  icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://player.smashy.stream/tv/${id}/${s}/${e}` },
      { label: 'VidSrc Net',    icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://vidsrc.net/embed/tv/${id}/${s}/${e}` },
      { label: 'Frembed',       icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://frembed.pro/api/serie.php?id=${id}&s=${s}&e=${e}` },
      { label: '2Embed Skin',   icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://2embed.skin/embed/tv/${id}/${s}/${e}` },
      { label: 'Embeds XYZ',    icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://embeds.xyz/embed/${id}?s=${s}&e=${e}` },
      { label: '2Embed Org',    icon: '▶', hd: true,  named: true, getUrl: (id,s,e) => `https://2embed.org/embed/tv/${id}/${s}/${e}` },
    ]
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
const LOAD_TIMEOUT = 14000

export default function PlayerModal({ item, type, onClose }) {
  const [domain, setDomain]             = useState('https://123movienow.cc')
  const [srcIdx, setSrcIdx]             = useState(0)
  const [loading, setLoading]           = useState(true)
  const [timedOut, setTimedOut]         = useState(false)
  const [season, setSeason]             = useState(1)
  const [episode, setEpisode]           = useState(1)
  const [resolvedImdb, setResolvedImdb] = useState(null)
  const [lookingUp, setLookingUp]       = useState(false)
  const [visible, setVisible]           = useState(false)
  const [showEpPanel, setShowEpPanel]   = useState(false)
  const [showDlPanel, setShowDlPanel]   = useState(false)
  const [dlLoading, setDlLoading]       = useState(false)
  const [dlGroups, setDlGroups]         = useState(null)
  const [dlError, setDlError]           = useState(null)

  const [retryIn, setRetryIn]             = useState(null)

  const loadTimer      = useRef(null)
  const autoRetryTimer = useRef(null)
  const srcListLenRef  = useRef(20)
  const iframeRef      = useRef()

  const isAnime     = type === 'anime'
  const isTV        = type === 'moviebox-tv' || type === 'tv'
  const needsLookup = item?._source === 'moviebox' || item?._mbId || item?._source === 'flixer' || isAnime
  const animeTitle  = isAnime ? (item.title_english || item.title || item.Title || '') : ''

  let title, year, id
  if (isAnime) {
    title = animeTitle
    year  = item.year || item.Year
    id    = resolvedImdb || ''
  } else if (isTV) {
    title = item.name || item.Title || item.title
    year  = item.premiered?.slice(0,4) || item.Year || item.releaseDate?.slice(0,4)
    id    = resolvedImdb || item.externals?.imdb || item.imdbID || ''
  } else {
    title = item.Title || item.title || item.name
    year  = item.Year || item.releaseDate?.slice(0,4) || item.premiered?.slice(0,4)
    id    = resolvedImdb || item.imdbID || ''
  }

  const sources    = makeSources(domain)
  const sourceList = isAnime ? (resolvedImdb ? sources.tv : null) : isTV ? sources.tv : sources.movie
  const activeSrc  = sourceList?.[srcIdx]
  const embedUrl   = id && activeSrc ? activeSrc.getUrl(id, season, episode, title) : null
  const showEps    = isTV || (isAnime && resolvedImdb)
  const poster     = item?.Poster || item?.poster || item?.images?.poster || item?.image_url

  const startLoadTimer = useCallback(() => {
    clearTimeout(loadTimer.current)
    clearTimeout(autoRetryTimer.current)
    setTimedOut(false)
    setRetryIn(null)
    loadTimer.current = setTimeout(() => {
      setLoading(false)
      setTimedOut(true)
      let count = 3
      setRetryIn(count)
      const tick = () => {
        count--
        if (count <= 0) {
          setRetryIn(null)
          setSrcIdx(prev => {
            const next = prev + 1
            if (next < srcListLenRef.current) {
              setLoading(true)
              setTimedOut(false)
              return next
            }
            return prev
          })
        } else {
          setRetryIn(count)
          autoRetryTimer.current = setTimeout(tick, 1000)
        }
      }
      autoRetryTimer.current = setTimeout(tick, 1000)
    }, LOAD_TIMEOUT)
  }, [])

  useEffect(() => {
    srcListLenRef.current = sourceList?.length ?? 20
  }, [sourceList])

  useEffect(() => {
    fetchMovieBoxDomain().then(setDomain)
    requestAnimationFrame(() => setVisible(true))
    return () => {
      clearTimeout(loadTimer.current)
      clearTimeout(autoRetryTimer.current)
    }
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
    setTimedOut(false)
    setSeason(1)
    setEpisode(1)
    setShowDlPanel(false)
    setDlGroups(null)
    setDlError(null)

    if (item.imdbID && !isAnime) { setResolvedImdb(item.imdbID); return }
    if (item.externals?.imdb && isTV) { setResolvedImdb(item.externals.imdb); return }

    if (needsLookup && !item.imdbID) {
      const lt = isAnime ? animeTitle : (item.Title || item.title)
      const ly = isAnime ? year : (item.Year || item.releaseDate?.slice(0,4))
      const isSeries = isTV || isAnime || item._mbType === 2
      if (!lt) return
      setLookingUp(true)
      getImdbId(lt, ly, isSeries).then(f => {
        if (f) setResolvedImdb(f)
        setLookingUp(false)
      })
    }
  }, [item])

  useEffect(() => {
    if (id && !lookingUp) {
      setLoading(true)
      setTimedOut(false)
      startLoadTimer()
    }
  }, [id, srcIdx, season, episode, lookingUp])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const switchServer = (i) => {
    clearTimeout(autoRetryTimer.current)
    setRetryIn(null)
    setSrcIdx(i)
    setLoading(true)
    setTimedOut(false)
  }

  const changeEpisode = (ep) => {
    setEpisode(ep)
    setLoading(true)
    setTimedOut(false)
  }

  const changeSeason = (s) => {
    setSeason(s)
    setEpisode(1)
    setLoading(true)
    setTimedOut(false)
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
        imdb: id,
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
            {!lookingUp && loading && !timedOut && (
              <div className="mb-loader">
                <div className="mb-spinner" />
                <p className="mb-loader-text">Loading {activeSrc?.label ?? 'Server'}…</p>
                <p className="mb-loader-hint">Will auto-switch if unavailable · or pick below</p>
              </div>
            )}
            {!lookingUp && timedOut && embedUrl && (
              <div className="mb-blocked-banner">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {retryIn !== null && srcIdx + 1 < srcListLenRef.current
                  ? `${activeSrc?.label} unavailable — trying next in ${retryIn}s`
                  : 'Server unavailable — pick another below'
                }
                {retryIn !== null && srcIdx + 1 < srcListLenRef.current && (
                  <button
                    className="mb-skip-btn"
                    onClick={() => {
                      clearTimeout(autoRetryTimer.current)
                      setRetryIn(null)
                      setSrcIdx(prev => {
                        const next = prev + 1
                        if (next < srcListLenRef.current) {
                          setLoading(true); setTimedOut(false); return next
                        }
                        return prev
                      })
                    }}
                  >
                    Skip →
                  </button>
                )}
              </div>
            )}

            {!lookingUp && embedUrl ? (
              <iframe
                ref={iframeRef}
                key={`${srcIdx}-${id}-${season}-${episode}`}
                className={`mb-iframe ${loading && !timedOut ? 'mb-iframe-hidden' : ''}`}
                src={embedUrl}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => {
                  clearTimeout(loadTimer.current)
                  setLoading(false)
                  setTimedOut(false)
                }}
              />
            ) : !lookingUp && isAnime && !resolvedImdb ? (
              <div className="mb-fallback">
                <div className="mb-fallback-title">Watch "{animeTitle}" on:</div>
                <div className="mb-link-grid">
                  {ANIME_LINKS.map((s, i) => (
                    <a key={i} href={s.url(animeTitle)} target="_blank" rel="noreferrer" className="mb-ext-btn">
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : !lookingUp && !id ? (
              <div className="mb-fallback">
                <div className="mb-fallback-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3ba776" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p>Stream not found for "<strong>{title}</strong>"</p>
                <p className="mb-fallback-sub">Try a different server below</p>
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

                {dlError && (
                  <div className="mb-dl-error">{dlError}</div>
                )}

                {!dlLoading && dlGroups !== null && dlGroups.length === 0 && (
                  <div className="mb-dl-empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3ba776" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>No downloads found for "{title}"</p>
                    <p className="mb-fallback-sub">Try searching on YTS or Nyaa</p>
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
                          {items.map((item, i) => (
                            <div key={i} className="mb-dl-item">
                              <div className="mb-dl-item-name">{item.name}</div>
                              <div className="mb-dl-item-meta">
                                <span className="mb-dl-size">{item.size}</span>
                                <span className="mb-dl-seeds">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#3ba776"><circle cx="12" cy="12" r="10"/></svg>
                                  {item.seeders} seeds
                                </span>
                              </div>
                              <a
                                href={item.magnet}
                                className="mb-dl-magnet-btn"
                                title="Open with torrent client"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Magnet Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="mb-dl-note">
                      Downloads open in your torrent client (qBittorrent, uTorrent, etc.)
                    </div>
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
          <div className="mb-server-row">
            <span className="mb-server-label">Source</span>
            <div className="mb-server-tabs">
              {(sourceList || []).map((s, i) => (
                <button
                  key={i}
                  className={`mb-server-tab ${srcIdx === i ? 'mb-tab-active' : ''} ${s.hd ? 'mb-tab-hd' : ''} ${s.named ? 'mb-tab-named' : ''}`}
                  onClick={() => switchServer(i)}
                >
                  {i === 0 && <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>}
                  {s.label}
                  {s.hd && <span className={`mb-hd-badge ${s.named ? 'mb-hd-badge-named' : ''}`}>{s.label.includes('4K') ? '4K' : 'HD'}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-action-row">
            {embedUrl && (
              <a className="mb-action-link" href={embedUrl} target="_blank" rel="noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open in Tab
              </a>
            )}
            {id?.startsWith?.('tt') && (
              <a className="mb-action-link" href={`https://www.imdb.com/title/${id}/`} target="_blank" rel="noreferrer">
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
