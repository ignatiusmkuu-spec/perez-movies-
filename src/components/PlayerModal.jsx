import { useState, useRef, useEffect } from 'react'
import { getImdbId } from '../api/moviebox'
import './PlayerModal.css'

const MOVIE_SOURCES = [
  {
    label: '123Movies',
    getUrl: (imdb) => `https://123movienow.cc/embed/movie/${imdb}`,
    direct: (imdb) => `https://123movienow.cc/movie/${imdb}`,
  },
  {
    label: 'VidSrc',
    getUrl: (imdb) => `https://vidsrc.net/embed/movie?imdb=${imdb}`,
    direct: (imdb) => `https://vidsrc.net/embed/movie?imdb=${imdb}`,
  },
  {
    label: 'MultiEmbed',
    getUrl: (imdb) => `https://multiembed.mov/?video_id=${imdb}`,
    direct: (imdb) => `https://multiembed.mov/?video_id=${imdb}`,
  },
  {
    label: '2Embed',
    getUrl: (imdb) => `https://www.2embed.cc/embed/${imdb}`,
    direct: (imdb) => `https://www.2embed.cc/embed/${imdb}`,
  },
  {
    label: 'EmbedHub',
    getUrl: (imdb) => `https://www.embedhub.cc/e/?imdb=${imdb}`,
    direct: (imdb) => `https://www.embedhub.cc/e/?imdb=${imdb}`,
  },
  {
    label: 'VidSrc.me',
    getUrl: (imdb) => `https://vidsrc.me/embed/movie?imdb=${imdb}`,
    direct: (imdb) => `https://vidsrc.me/embed/movie?imdb=${imdb}`,
  },
]

const TV_SOURCES = [
  {
    label: '123Movies',
    getUrl: (imdb, s, e) => `https://123movienow.cc/embed/tv/${imdb}/${s}/${e}`,
    direct: (imdb, s, e) => `https://123movienow.cc/tv/${imdb}/${s}/${e}`,
  },
  {
    label: 'VidSrc',
    getUrl: (imdb, s, e) => `https://vidsrc.net/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
    direct: (imdb, s, e) => `https://vidsrc.net/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
  },
  {
    label: 'MultiEmbed',
    getUrl: (imdb, s, e) => `https://multiembed.mov/?video_id=${imdb}&s=${s}&e=${e}`,
    direct: (imdb, s, e) => `https://multiembed.mov/?video_id=${imdb}&s=${s}&e=${e}`,
  },
  {
    label: '2Embed',
    getUrl: (imdb, s, e) => `https://www.2embed.cc/embedtv/${imdb}&s=${s}&e=${e}`,
    direct: (imdb, s, e) => `https://www.2embed.cc/embedtv/${imdb}&s=${s}&e=${e}`,
  },
  {
    label: 'VidSrc.me',
    getUrl: (imdb, s, e) => `https://vidsrc.me/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
    direct: (imdb, s, e) => `https://vidsrc.me/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
  },
]

const ANIME_SOURCES = [
  {
    label: 'HiAnime',
    getUrl: (t) => `https://hianime.to/search?keyword=${encodeURIComponent(t)}`,
    direct: (t) => `https://hianime.to/search?keyword=${encodeURIComponent(t)}`,
  },
  {
    label: 'AniWatch',
    getUrl: (t) => `https://aniwatch.to/search?keyword=${encodeURIComponent(t)}`,
    direct: (t) => `https://aniwatch.to/search?keyword=${encodeURIComponent(t)}`,
  },
  {
    label: 'AnimePahe',
    getUrl: (t) => `https://animepahe.ru/anime?q=${encodeURIComponent(t)}`,
    direct: (t) => `https://animepahe.ru/anime?q=${encodeURIComponent(t)}`,
  },
  {
    label: 'GogoAnime',
    getUrl: (t) => `https://anitaku.pe/search.html?keyword=${encodeURIComponent(t)}`,
    direct: (t) => `https://anitaku.pe/search.html?keyword=${encodeURIComponent(t)}`,
  },
]

export default function PlayerModal({ item, type, onClose }) {
  const [srcIdx, setSrcIdx] = useState(0)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [resolvedImdb, setResolvedImdb] = useState(null)
  const [imdbLookingUp, setImdbLookingUp] = useState(false)
  const iframeRef = useRef()

  const isMbItem = item?._source === 'moviebox' || item?._mbId
  const isTV = type === 'moviebox-tv' || type === 'tv'
  const isAnime = type === 'anime'

  let sources, id, title, year

  if (isAnime) {
    sources = ANIME_SOURCES
    id = item.title_english || item.title || item.Title
    title = id
    year = item.year || item.Year
  } else if (isTV || type === 'moviebox-tv') {
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
    if (isMbItem && !item.imdbID && !isAnime) {
      const mbTitle = item.Title || item.title
      const mbYear = item.Year || item.releaseDate?.slice(0, 4)
      const isSeriesType = isTV || item._mbType === 2
      setImdbLookingUp(true)
      getImdbId(mbTitle, mbYear, isSeriesType).then(found => {
        if (found) setResolvedImdb(found)
        setImdbLookingUp(false)
      })
    } else {
      setResolvedImdb(item.imdbID || null)
    }
  }, [item, isMbItem, isAnime, isTV])

  const currentSource = sources[srcIdx]
  const embedUrl = id ? currentSource?.getUrl(id, season, episode) : null
  const directUrl = id ? currentSource?.direct(id, season, episode) : null

  const handleSrcChange = (i) => {
    setSrcIdx(i)
    setIframeLoading(true)
  }

  const showingPlayer = !isAnime

  return (
    <div className="player-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="player-box">

        <div className="player-header">
          <div className="player-header-info">
            <div className="player-title">{title}</div>
            <div className="player-year">
              {year}
              {(isTV || type === 'moviebox-tv') ? ` · S${season} E${episode}` : ''}
            </div>
          </div>
          <button className="player-close" onClick={onClose}>✕</button>
        </div>

        {(isTV || type === 'moviebox-tv') && (
          <div className="episode-picker">
            <label>
              Season
              <input
                type="number" min="1" max="30" value={season}
                onChange={e => { setSeason(+e.target.value || 1); setIframeLoading(true) }}
              />
            </label>
            <label>
              Episode
              <input
                type="number" min="1" max="200" value={episode}
                onChange={e => { setEpisode(+e.target.value || 1); setIframeLoading(true) }}
              />
            </label>
          </div>
        )}

        <div className="player-hint">
          <span>⚡ If video doesn't load, try a different server below</span>
        </div>

        <div className="player-iframe-wrap">
          {(iframeLoading || imdbLookingUp) && (
            <div className="player-loading">
              <div className="spinner" />
              <p>{imdbLookingUp ? 'Finding stream...' : 'Connecting to server...'}</p>
            </div>
          )}

          {!imdbLookingUp && embedUrl ? (
            <iframe
              ref={iframeRef}
              key={`${srcIdx}-${id}-${season}-${episode}`}
              className="player-iframe"
              src={embedUrl}
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setIframeLoading(false)}
            />
          ) : !imdbLookingUp && !id ? (
            <div className="player-loading">
              <p style={{fontSize:'1rem',color:'var(--text2)'}}>
                Could not find stream for "{title}".<br />Try searching manually below.
              </p>
              {sources.filter(s => !s.getUrl('').includes('imdb')).map((s, i) => (
                <a key={i} href={s.direct(title)} target="_blank" rel="noreferrer" className="action-btn watch" style={{marginTop:'0.5rem'}}>
                  🔍 Search on {s.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="player-sources">
          <span className="sources-label">Servers:</span>
          {sources.map((s, i) => (
            <button
              key={i}
              className={`source-btn ${srcIdx === i ? 'active' : ''}`}
              onClick={() => handleSrcChange(i)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="player-actions">
          {directUrl && (
            <a className="action-btn watch" href={directUrl} target="_blank" rel="noreferrer">
              🔗 Open in New Tab
            </a>
          )}
          {id?.startsWith?.('tt') && (
            <a
              className="action-btn dl"
              href={`https://www.imdb.com/title/${id}/`}
              target="_blank"
              rel="noreferrer"
            >
              ★ IMDB Info
            </a>
          )}
          {showingPlayer && title && (
            <a
              className="action-btn info"
              href={`https://yts.mx/browse-movies/${encodeURIComponent(title || '')}/${year || '0'}`}
              target="_blank"
              rel="noreferrer"
            >
              ⬇ Download
            </a>
          )}
        </div>

      </div>
    </div>
  )
}
