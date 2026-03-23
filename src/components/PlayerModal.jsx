import { useState, useEffect, useRef } from 'react'
import { getImdbId } from '../api/moviebox'
import { fetchDownloads, groupByQuality } from '../api/download'
import CasperPlayer from './CasperPlayer'
import NewtoxicPlayer from './NewtoxicPlayer'
import './PlayerModal.css'

const ALL_SERVERS = [
  {
    label: 'IgnatiuStream',
    usesSubjectId: true,
    movie: (id) => `https://movieapi.xcasper.space/api/play?subjectId=${id}`,
    tv:    (id, s, e) => `https://movieapi.xcasper.space/api/play?subjectId=${id}&season=${s}&episode=${e}`,
  },
  {
    label: 'VidSrc.to',
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv:    (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: 'VidSrc.rip',
    movie: (id) => `https://vidsrc.rip/embed/movie/${id}`,
    tv:    (id, s, e) => `https://vidsrc.rip/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: 'NontonGo',
    movie: (id) => `https://www.nontongo.win/embed/movie/${id}`,
    tv:    (id, s, e) => `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: 'Smashy',
    movie: (id) => `https://embed.smashystream.com/playere.php?imdb=${id}`,
    tv:    (id, s, e) => `https://embed.smashystream.com/playere.php?imdb=${id}&season=${s}&episode=${e}`,
  },
  {
    label: 'MultiEmbed',
    movie: (id) => `https://multiembed.mov/?video_id=${id}`,
    tv:    (id, s, e) => `https://multiembed.mov/?video_id=${id}&s=${s}&e=${e}`,
  },
  {
    label: 'VidSrc',
    movie: (id) => `https://vidsrc.xyz/embed/movie?imdb=${id}`,
    tv:    (id, s, e) => `https://vidsrc.xyz/embed/tv?imdb=${id}&season=${s}&episode=${e}`,
  },
  {
    label: 'Flixer',
    movie: (id) => `https://flixer.su/embed/${id}`,
    tv:    (id, s, e) => `https://flixer.su/embed/${id}?s=${s}&e=${e}`,
  },
  {
    label: 'RiveStream',
    movie: (id) => `https://rivestream.live/embed?type=movie&id=${id}`,
    tv:    (id, s, e) => `https://rivestream.live/embed?type=tv&id=${id}&season=${s}&episode=${e}`,
  },
  {
    label: 'VidSrc.me',
    movie: (id) => `https://vidsrc.me/embed/movie/${id}`,
    tv:    (id, s, e) => `https://vidsrc.me/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: '2Embed',
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv:    (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    label: 'SuperEmbed',
    movie: (id) => `https://multiembed.mov/directstream.php?video_id=${id}`,
    tv:    (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&s=${s}&e=${e}`,
  },
  {
    label: 'PStream',
    movie: (id) => `https://pstream.mov/embed/movie/${id}`,
    tv:    (id, s, e) => `https://pstream.mov/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: '123Movies',
    movie: (id) => `https://123movienow.cc/embed/movie/${id}`,
    tv:    (id, s, e) => `https://123movienow.cc/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: 'MoviesAPI',
    movie: (id) => `https://moviesapi.to/movie/${id}`,
    tv:    (id, s, e) => `https://moviesapi.to/tv/${id}-${s}-${e}`,
  },
  {
    label: 'FilmPrime',
    movie: (id) => `https://filmprime.link/embed/movie/${id}`,
    tv:    (id, s, e) => `https://filmprime.link/embed/tv/${id}/${s}/${e}`,
  },
]

const ANIME_LINKS = [
  { label: 'HiAnime',    url: (t) => `https://hianime.to/search?keyword=${encodeURIComponent(t)}` },
  { label: 'AniWatch',   url: (t) => `https://aniwatch.to/search?keyword=${encodeURIComponent(t)}` },
  { label: 'GogoAnime',  url: (t) => `https://gogoanime3.co/search.html?keyword=${encodeURIComponent(t)}` },
  { label: 'Crunchyroll', url: (t) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}` },
]

const MAX_EPISODES = 30
const MAX_SEASONS  = 15

export default function PlayerModal({ item, type, onClose }) {
  const [season, setSeason]               = useState(1)
  const [episode, setEpisode]             = useState(1)
  const [visible, setVisible]             = useState(false)
  const [showEpPanel, setShowEpPanel]     = useState(false)
  const [showDlPanel, setShowDlPanel]     = useState(false)
  const [dlLoading, setDlLoading]         = useState(false)
  const [dlGroups, setDlGroups]           = useState(null)
  const [dlError, setDlError]             = useState(null)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [imdbId, setImdbId]               = useState(null)
  const [lookingUp, setLookingUp]         = useState(false)
  const [manualInput, setManualInput]     = useState('')
  const [serverIdx, setServerIdx]               = useState(0)
  const [showServers, setShowServers]           = useState(false)
  const [failoverMsg, setFailoverMsg]           = useState(null)
  const [manualSwitch, setManualSwitch]         = useState(false)
  const [casperSubjectId, setCasperSubjectId]   = useState(null)
  const [casperLookingUp, setCasperLookingUp]   = useState(false)
  const [nativePlayerFailed, setNativePlayerFailed] = useState(false)

  const imdbRef               = useRef(null)
  const failoverRef           = useRef(null)
  const casperLookupDoneRef   = useRef(false)

  const isAnime = type === 'anime'
  const isTV    = type === 'moviebox-tv' || type === 'tv'

  let title, year, poster
  if (isAnime) {
    title  = item.title_english || item.title || item.Title || ''
    year   = item.year || item.Year
    poster = item.images?.jpg?.image_url || item.image_url || null
  } else if (isTV) {
    title  = item.name || item.Title || item.title
    year   = item.premiered?.slice(0,4) || item.Year || item.releaseDate?.slice(0,4)
    poster = item.image?.medium || item.image?.original || item.Poster || item.cover?.url || null
  } else {
    title  = item.Title || item.title || item.name
    year   = item.Year || item.releaseDate?.slice(0,4) || item.premiered?.slice(0,4)
    poster = item.Poster || item.cover?.url || item.thumbnail || item.image?.medium || null
  }

  const showEps      = isTV || isAnime
  const visibleServers = showEps ? ALL_SERVERS.filter(s => !s.movieOnly) : ALL_SERVERS
  const safeIdx      = Math.min(serverIdx, visibleServers.length - 1)
  const srv          = visibleServers[safeIdx]
  const embedUrl = srv?.usesSubjectId
    ? (casperSubjectId ? (showEps ? srv.tv(casperSubjectId, season, episode) : srv.movie(casperSubjectId)) : null)
    : (imdbId && srv ? (showEps ? srv.tv(imdbId, season, episode) : srv.movie(imdbId)) : null)

  useEffect(() => {
    setLookingUp(false)
    setImdbId(null)
    imdbRef.current = null
    setCasperSubjectId(null)
    setCasperLookingUp(false)
    casperLookupDoneRef.current = false
    setNativePlayerFailed(false)
    setSeason(1)
    setEpisode(1)
    setServerIdx(0)
    setShowServers(false)
    setShowDlPanel(false)
    setDlGroups(null)
    setDlError(null)
    setIframeLoading(true)
    setFailoverMsg(null)
    setManualSwitch(false)
    setManualInput('')
    if (failoverRef.current) {
      clearTimeout(failoverRef.current)
      failoverRef.current = null
    }

    if (item._newtoxicSlug) {
      casperLookupDoneRef.current = true
      return
    }

    const directId =
      item.imdbID ||
      item.externals?.imdb ||
      null

    if (directId) {
      setImdbId(directId)
      imdbRef.current = directId
    } else if (title) {
      setLookingUp(true)
      getImdbId(title, year, isTV || isAnime).then(found => {
        if (found) {
          setImdbId(found)
          imdbRef.current = found
        }
        setLookingUp(false)
      })
    }

    if (item._mbId) {
      setCasperSubjectId(item._mbId)
      casperLookupDoneRef.current = true
    } else if (item.subjectId) {
      setCasperSubjectId(item.subjectId)
      casperLookupDoneRef.current = true
    } else if (item._showboxId) {
      setCasperLookingUp(true)
      const mbType = (isTV || isAnime) ? 'tv' : 'movie'
      fetch(`/api/showbox-resolve?id=${item._showboxId}&type=${mbType}`)
        .then(r => r.json())
        .then(data => { if (data?.subjectId) setCasperSubjectId(data.subjectId) })
        .catch(() => {})
        .finally(() => { casperLookupDoneRef.current = true; setCasperLookingUp(false) })
    } else if (title) {
      const mbType = (isTV || isAnime) ? 'tv' : 'movie'
      setCasperLookingUp(true)

      const cleanTitle = title.split(':')[0].split('(')[0].trim()
      const shortTitle = title.split(' ').slice(0, 3).join(' ')

      const casperQ = (q) => fetch(`/api/casper-search?q=${encodeURIComponent(q)}&type=${mbType}`)
        .then(r => r.json())
        .then(data => { const id = data?.subjectId; if (!id) throw new Error('no result'); return id })

      const mbSearch = fetch(`/api/moviebox-search?q=${encodeURIComponent(title)}&type=${mbType}`)
        .then(r => r.json())
        .then(data => { const id = data?.mbId; if (!id) throw new Error('no result'); return id })

      const showboxFallback = fetch(`/api/showbox-search?q=${encodeURIComponent(cleanTitle)}&type=${mbType}`)
        .then(r => r.json())
        .then(data => {
          const item = data?.items?.[0]
          if (!item?.id) throw new Error('no result')
          return fetch(`/api/showbox-resolve?id=${item.id}&type=${mbType}`)
        })
        .then(r => r.json())
        .then(data => { if (!data?.subjectId) throw new Error('no subjectId'); return data.subjectId })

      const searches = [
        mbSearch,
        casperQ(title),
        ...(cleanTitle !== title ? [casperQ(cleanTitle)] : []),
        ...(shortTitle !== title && shortTitle !== cleanTitle ? [casperQ(shortTitle)] : []),
        showboxFallback,
      ]

      Promise.any(searches)
        .then(found => { if (found) setCasperSubjectId(found) })
        .catch(() => {})
        .finally(() => {
          casperLookupDoneRef.current = true
          setCasperLookingUp(false)
        })
    } else {
      casperLookupDoneRef.current = true
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
    setFailoverMsg(null)
  }, [season, episode, serverIdx, imdbId])

  useEffect(() => {
    if (failoverRef.current) {
      clearTimeout(failoverRef.current)
      failoverRef.current = null
    }

    if (!embedUrl || !iframeLoading || lookingUp || manualSwitch || srv?.usesSubjectId) return

    const failoverIdx = visibleServers.findIndex(s => s.label === 'VidSrc.to')
    if (failoverIdx === -1 || failoverIdx === safeIdx) return

    failoverRef.current = setTimeout(() => {
      setFailoverMsg('Stream timed out — switching to VidSrc.to…')
      setServerIdx(failoverIdx)
      setIframeLoading(true)
      failoverRef.current = null
    }, 8000)

    return () => {
      if (failoverRef.current) {
        clearTimeout(failoverRef.current)
        failoverRef.current = null
      }
    }
  }, [embedUrl, iframeLoading, lookingUp, manualSwitch])

  useEffect(() => {
    if (!srv?.usesSubjectId) return
    if (casperLookingUp) return
    if (casperSubjectId) return
    if (manualSwitch) return
    if (!casperLookupDoneRef.current) return
    const nextIdx = visibleServers.findIndex(s => !s.usesSubjectId)
    if (nextIdx === -1) return
    setServerIdx(nextIdx)
    setIframeLoading(true)
  }, [casperLookingUp, casperSubjectId])

  useEffect(() => {
    if (!nativePlayerFailed) return
    if (manualSwitch) return
    const nextIdx = visibleServers.findIndex(s => !s.usesSubjectId)
    if (nextIdx === -1) return
    setServerIdx(nextIdx)
    setIframeLoading(true)
  }, [nativePlayerFailed])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const switchServer = (idx) => {
    setManualSwitch(true)
    setServerIdx(idx)
    setIframeLoading(true)
    setFailoverMsg(null)
    setNativePlayerFailed(false)
    if (failoverRef.current) {
      clearTimeout(failoverRef.current)
      failoverRef.current = null
    }
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
        title, year,
        imdb: imdbRef.current || imdbId,
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

  const isLookingUpAny = lookingUp || (srv?.usesSubjectId && casperLookingUp)
  const noStream = !isLookingUpAny && (srv?.usesSubjectId ? !casperSubjectId : !imdbId)

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

            {isLookingUpAny && (
              <div className="mb-loader">
                <div className="mb-spinner" />
                <p className="mb-loader-text">
                  {srv?.usesSubjectId && casperLookingUp ? 'Finding IgnatiuStream source…' : 'Finding stream…'}
                </p>
              </div>
            )}

            {!isLookingUpAny && iframeLoading && embedUrl && !(srv?.usesSubjectId && casperSubjectId && !nativePlayerFailed) && (
              <div className="mb-loader">
                <div className="mb-spinner" />
                <p className="mb-loader-text">
                  {failoverMsg || `Loading ${srv?.label}…`}
                </p>
                {!failoverMsg && !srv?.usesSubjectId && (
                  <p className="mb-loader-sub">Auto-switching to VidSrc.to if stream is slow…</p>
                )}
              </div>
            )}

            {!isLookingUpAny && srv?.usesSubjectId && item._newtoxicSlug && !nativePlayerFailed ? (
              <NewtoxicPlayer
                key={`ntx-${item._newtoxicSlug}-${season}-${episode}`}
                slug={item._newtoxicSlug}
                type={item._newtoxicType || (showEps ? 'tv' : 'movie')}
                onError={() => setNativePlayerFailed(true)}
                title={title}
                poster={poster}
              />
            ) : !isLookingUpAny && srv?.usesSubjectId && casperSubjectId && !nativePlayerFailed ? (
              <CasperPlayer
                key={`casper-${casperSubjectId}-${season}-${episode}`}
                subjectId={casperSubjectId}
                season={showEps ? season : undefined}
                episode={showEps ? episode : undefined}
                onNativeError={() => setNativePlayerFailed(true)}
                title={title}
                poster={poster}
              />
            ) : !isLookingUpAny && embedUrl ? (
              <iframe
                key={`${safeIdx}-${casperSubjectId || imdbId}-${season}-${episode}`}
                className={`mb-iframe ${iframeLoading ? 'mb-iframe-hidden' : ''}`}
                src={embedUrl}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; web-share"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => { setIframeLoading(false); setFailoverMsg(null) }}
                onError={() => {
                  const failIdx = visibleServers.findIndex(s => s.label === 'VidSrc.to')
                  if (failIdx !== -1 && failIdx !== safeIdx) {
                    setFailoverMsg('Stream error — switching to VidSrc.to…')
                    setServerIdx(failIdx)
                    setIframeLoading(true)
                  }
                }}
              />
            ) : !isLookingUpAny && isAnime && noStream ? (
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
            ) : !isLookingUpAny && noStream ? (
              <div className="mb-fallback">
                <div className="mb-fallback-icon">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p className="mb-fallback-title-text">Could not auto-match "<strong>{title}</strong>"</p>
                <p className="mb-fallback-sub">Enter the IMDB ID to play directly, or browse below.</p>

                <div className="mb-manual-imdb">
                  <div className="mb-manual-row">
                    <input
                      className="mb-manual-input"
                      placeholder="IMDB ID — e.g. tt10857164"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value.trim())}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const id = manualInput.match(/tt\d{7,8}/)?.[0] || (manualInput.startsWith('tt') ? manualInput : null)
                          if (id) { setImdbId(id); imdbRef.current = id; setServerIdx(visibleServers.findIndex(s => s.label === 'VidSrc.to') || 1); setIframeLoading(true) }
                        }
                      }}
                    />
                    <button
                      className="mb-manual-btn"
                      onClick={() => {
                        const id = manualInput.match(/tt\d{7,8}/)?.[0] || (manualInput.startsWith('tt') ? manualInput : null)
                        if (id) { setImdbId(id); imdbRef.current = id; setServerIdx(visibleServers.findIndex(s => s.label === 'VidSrc.to') || 1); setIframeLoading(true) }
                      }}
                    >▶ Play</button>
                  </div>
                  <p className="mb-manual-hint">
                    Find it at{' '}
                    <a href={`https://www.imdb.com/find/?q=${encodeURIComponent(title)}`} target="_blank" rel="noreferrer" className="mb-hint-link">imdb.com</a>
                  </p>
                </div>

                <div className="mb-fallback-search">
                  <p className="mb-manual-label">Quick links:</p>
                  <div className="mb-link-grid">
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' full movie')}`} target="_blank" rel="noreferrer" className="mb-ext-btn">YouTube</a>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(title + ' watch online free')}`} target="_blank" rel="noreferrer" className="mb-ext-btn">Google</a>
                    <a href={`https://www.imdb.com/find/?q=${encodeURIComponent(title)}`} target="_blank" rel="noreferrer" className="mb-ext-btn">IMDB</a>
                    <a href={`https://vidsrc.to/search?keyword=${encodeURIComponent(title)}`} target="_blank" rel="noreferrer" className="mb-ext-btn">VidSrc.to</a>
                  </div>
                </div>
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
          {showServers && (
            <div className="mb-server-row">
              <div className="mb-server-tabs">
                {visibleServers.map((s, i) => (
                  <button
                    key={i}
                    className={`mb-server-tab ${i === safeIdx ? 'mb-tab-active' : ''}`}
                    onClick={() => { setServerIdx(i); setShowServers(false) }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mb-action-row">
            <button
              className={`mb-action-link mb-server-toggle ${showServers ? 'mb-dl-active' : ''}`}
              onClick={() => { setShowServers(s => !s); setShowDlPanel(false) }}
              title={`Current: ${srv?.label}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
              {showServers ? 'Hide Servers' : `${srv?.label} ▾`}
            </button>
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
