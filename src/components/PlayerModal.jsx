import { useState, useRef } from 'react'
import './PlayerModal.css'

const MOVIE_SOURCES = [
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
    label: 'MovieBox',
    getUrl: (imdb) => `https://moviesapi.to/movie/${imdb}`,
    direct: (imdb) => `https://moviesapi.to/movie/${imdb}`,
  },
  {
    label: 'Flixer',
    getUrl: (imdb) => `https://flixerz.to/embed/movie/${imdb}`,
    direct: (imdb) => `https://flixerz.to/movie/${imdb}`,
  },
]

const TV_SOURCES = [
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
    label: 'MovieBox',
    getUrl: (imdb, s, e) => `https://moviesapi.to/tv/${imdb}-${s}-${e}`,
    direct: (imdb, s, e) => `https://moviesapi.to/tv/${imdb}-${s}-${e}`,
  },
]

const ANIME_SOURCES = [
  {
    label: 'HiAnime',
    getUrl: (title) => `https://hianime.to/search?keyword=${encodeURIComponent(title)}`,
    direct: (title) => `https://hianime.to/search?keyword=${encodeURIComponent(title)}`,
  },
  {
    label: 'AniWatch',
    getUrl: (title) => `https://aniwatch.to/search?keyword=${encodeURIComponent(title)}`,
    direct: (title) => `https://aniwatch.to/search?keyword=${encodeURIComponent(title)}`,
  },
  {
    label: 'GogoAnime',
    getUrl: (title) => `https://anitaku.pe/search.html?keyword=${encodeURIComponent(title)}`,
    direct: (title) => `https://anitaku.pe/search.html?keyword=${encodeURIComponent(title)}`,
  },
]

export default function PlayerModal({ item, type, onClose }) {
  const [srcIdx, setSrcIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const iframeRef = useRef()

  let sources, id, title, year

  if (type === 'movie') {
    sources = MOVIE_SOURCES
    id = item.imdbID
    title = item.Title
    year = item.Year
  } else if (type === 'tv') {
    sources = TV_SOURCES
    id = item.externals?.imdb || item.imdbID || ''
    title = item.name
    year = item.premiered?.slice(0, 4)
  } else {
    sources = ANIME_SOURCES
    id = item.title_english || item.title
    title = item.title_english || item.title
    year = item.year
  }

  const currentSource = sources[srcIdx]
  const embedUrl = currentSource?.getUrl(id, season, episode)
  const directUrl = currentSource?.direct(id, season, episode)

  const handleSrcChange = (i) => {
    setSrcIdx(i)
    setLoading(true)
  }

  return (
    <div className="player-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="player-box">

        <div className="player-header">
          <div className="player-header-info">
            <div className="player-title">{title}</div>
            <div className="player-year">
              {year}
              {type === 'tv' ? ` · Season ${season} Episode ${episode}` : ''}
            </div>
          </div>
          <button className="player-close" onClick={onClose}>✕</button>
        </div>

        {type === 'tv' && (
          <div className="episode-picker">
            <label>
              Season
              <input
                type="number" min="1" max="30" value={season}
                onChange={e => { setSeason(+e.target.value || 1); setLoading(true) }}
              />
            </label>
            <label>
              Episode
              <input
                type="number" min="1" max="100" value={episode}
                onChange={e => { setEpisode(+e.target.value || 1); setLoading(true) }}
              />
            </label>
          </div>
        )}

        <div className="player-hint">
          <span>⚡ If video doesn't load, try a different server below</span>
        </div>

        <div className="player-iframe-wrap">
          {loading && (
            <div className="player-loading">
              <div className="spinner" />
              <p>Connecting to stream...</p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            key={`${srcIdx}-${id}-${season}-${episode}`}
            className="player-iframe"
            src={embedUrl}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setLoading(false)}
          />
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
          <a className="action-btn watch" href={directUrl} target="_blank" rel="noreferrer">
            🔗 Open in New Tab
          </a>
          {type === 'movie' && id?.startsWith('tt') && (
            <a
              className="action-btn dl"
              href={`https://www.imdb.com/title/${id}/`}
              target="_blank"
              rel="noreferrer"
            >
              ★ IMDB Info
            </a>
          )}
          {type === 'movie' && (
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
