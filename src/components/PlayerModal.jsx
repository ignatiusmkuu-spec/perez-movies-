import { useState, useRef, useEffect } from 'react'
import { getImdbId } from '../api/moviebox'
import './PlayerModal.css'

const MOVIE_SOURCES = [
  {
    label: '123Movies',
    getUrl: (imdb) => `https://123movienow.cc/embed/movie/${imdb}`,
    direct: (imdb) => `https://123movienow.cc/embed/movie/${imdb}`,
  },
  {
    label: 'VidSrc',
    getUrl: (imdb) => `https://vidsrc.net/embed/movie?imdb=${imdb}`,
    direct: (imdb) => `https://vidsrc.net/embed/movie?imdb=${imdb}`,
  },
  {
    label: 'VidLink',
    getUrl: (imdb) => `https://vidlink.pro/movie/${imdb}`,
    direct: (imdb) => `https://vidlink.pro/movie/${imdb}`,
  },
  {
    label: 'SmashyStream',
    getUrl: (imdb) => `https://embed.smashystream.com/playere.php?imdb=${imdb}`,
    direct: (imdb) => `https://embed.smashystream.com/playere.php?imdb=${imdb}`,
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
    label: 'VidSrc.me',
    getUrl: (imdb) => `https://vidsrc.me/embed/movie?imdb=${imdb}`,
    direct: (imdb) => `https://vidsrc.me/embed/movie?imdb=${imdb}`,
  },
]

const TV_SOURCES = [
  {
    label: '123Movies',
    getUrl: (imdb, s, e) => `https://123movienow.cc/embed/tv/${imdb}/${s}/${e}`,
    direct: (imdb, s, e) => `https://123movienow.cc/embed/tv/${imdb}/${s}/${e}`,
  },
  {
    label: 'VidSrc',
    getUrl: (imdb, s, e) => `https://vidsrc.net/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
    direct: (imdb, s, e) => `https://vidsrc.net/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
  },
  {
    label: 'SmashyStream',
    getUrl: (imdb, s, e) => `https://embed.smashystream.com/playere.php?imdb=${imdb}&s=${s}&e=${e}`,
    direct: (imdb, s, e) => `https://embed.smashystream.com/playere.php?imdb=${imdb}&s=${s}&e=${e}`,
  },
  {
    label: 'MultiEmbed',
    getUrl: (imdb, s, e) => `https://multiembed.mov/?video_id=${imdb}&s=${s}&e=${e}`,
    direct: (imdb, s, e) => `https://multiembed.mov/?video_id=${imdb}&s=${s}&e=${e}`,
  },
  {
    label: '2Embed',
    getUrl: (imdb, s, e) => `https://www.2embed.cc/embedtvfull/${imdb}&s=${s}&e=${e}`,
    direct: (imdb, s, e) => `https://www.2embed.cc/embedtvfull/${imdb}&s=${s}&e=${e}`,
  },
  {
    label: 'VidSrc.me',
    getUrl: (imdb, s, e) => `https://vidsrc.me/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
    direct: (imdb, s, e) => `https://vidsrc.me/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`,
  },
]

const ANIME_SEARCH_LINKS = [
  {
    label: 'HiAnime',
    url: (t) => `https://hianime.to/search?keyword=${encodeURIComponent(t)}`,
  },
  {
    label: 'AniWatch',
    url: (t) => `https://aniwatch.to/search?keyword=${encodeURIComponent(t)}`,
  },
  {
    label: 'GogoAnime',
    url: (t) => `https://gogoanime3.co/search.html?keyword=${encodeURIComponent(t)}`,
  },
  {
    label: 'Crunchyroll',
    url: (t) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}`,
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

  const isAnime = type === 'anime'
  const isTV = type === 'moviebox-tv' || type === 'tv'
  const needsImdbLookup = item?._source === 'moviebox' || item?._mbId || item?._source === 'flixer' || isAnime

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
    setResolvedImdb(null)
    setSrcIdx(0)
    setIframeLoading(true)

    if (item.imdbID && !isAnime) {
      setResolvedImdb(item.imdbID)
      return
    }
    if (item.externals?.imdb && isTV) {
      setResolvedImdb(item.externals.imdb)
      return
    }

    if (needsImdbLookup && !item.imdbID) {
      const lookupTitle = isAnime ? animeTitle : (item.Title || item.title)
      const lookupYear = isAnime ? year : (item.Year || item.releaseDate?.slice(0, 4))
      const isSeries = isTV || isAnime || item._mbType === 2
      if (!lookupTitle) return
      setImdbLookingUp(true)
      getImdbId(lookupTitle, lookupYear, isSeries).then(found => {
        if (found) setResolvedImdb(found)
        setImdbLookingUp(false)
      })
    }
  }, [item])

  const showEpisodePicker = isTV || (isAnime && resolvedImdb)
  const currentSource = sources?.[srcIdx]
  const embedUrl = id && currentSource ? currentSource.getUrl(id, season, episode) : null
  const directUrl = id && currentSource ? currentSource.direct(id, season, episode) : null

  const handleSrcChange = (i) => {
    setSrcIdx(i)
    setIframeLoading(true)
  }

  return (
    <div className="player-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="player-box">

        <div className="player-header">
          <div className="player-header-info">
            <div className="player-title">{title}</div>
            <div className="player-year">
              {year}
              {showEpisodePicker ? ` · S${season} E${episode}` : ''}
            </div>
          </div>
          <button className="player-close" onClick={onClose}>✕</button>
        </div>

        {showEpisodePicker && (
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
                type="number" min="1" max="500" value={episode}
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
          ) : !imdbLookingUp && isAnime && !resolvedImdb ? (
            <div className="player-loading anime-fallback">
              <p>Stream this anime on:</p>
              <div className="anime-links">
                {ANIME_SEARCH_LINKS.map((s, i) => (
                  <a key={i} href={s.url(animeTitle)} target="_blank" rel="noreferrer" className="action-btn watch">
                    ▶ {s.label}
                  </a>
                ))}
              </div>
            </div>
          ) : !imdbLookingUp && !id ? (
            <div className="player-loading">
              <p style={{ fontSize: '1rem', color: 'var(--text2)' }}>
                Could not find a stream for "{title}".<br />Try a server button below or open in a new tab.
              </p>
            </div>
          ) : null}
        </div>

        {sources && sources.length > 0 && (
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
        )}

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
          {title && (
            <a
              className="action-btn info"
              href={`https://yts.mx/browse-movies/${encodeURIComponent(title)}/${year || '0'}`}
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
