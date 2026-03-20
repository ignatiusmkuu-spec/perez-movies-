import { useState } from 'react'
import './PlayerModal.css'

const MOVIE_SOURCES = [
  { label: 'Server 1', getUrl: (id) => `https://vidsrc.to/embed/movie/${id}` },
  { label: 'Server 2', getUrl: (id) => `https://vidsrc.me/embed/movie?imdb=${id}` },
  { label: 'Server 3', getUrl: (id) => `https://www.2embed.cc/embed/${id}` },
  { label: 'Server 4', getUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=0` },
]

const TV_SOURCES = [
  { label: 'Server 1', getUrl: (id) => `https://vidsrc.to/embed/tv/${id}` },
  { label: 'Server 2', getUrl: (id) => `https://vidsrc.me/embed/tv?imdb=${id}` },
  { label: 'Server 3', getUrl: (id) => `https://www.2embed.cc/embedtv/${id}` },
]

const ANIME_SOURCES = [
  { label: 'Server 1', getUrl: (title) => `https://gogoanime3.net/search.html?keyword=${encodeURIComponent(title)}` },
  { label: 'Server 2', getUrl: (title) => `https://hianime.to/search?keyword=${encodeURIComponent(title)}` },
]

export default function PlayerModal({ item, type, onClose }) {
  const [srcIdx, setSrcIdx] = useState(0)

  let sources, id, title, year, downloadUrl

  if (type === 'movie') {
    sources = MOVIE_SOURCES
    id = item.imdbID
    title = item.Title
    year = item.Year
    downloadUrl = `https://yts.mx/browse-movies/${item.Title?.replace(/ /g, '-').toLowerCase()}-${item.Year}`
  } else if (type === 'tv') {
    sources = TV_SOURCES
    id = item.externals?.imdb || String(item.id)
    title = item.name
    year = item.premiered?.slice(0, 4)
  } else {
    sources = ANIME_SOURCES
    id = item.title_english || item.title
    title = item.title_english || item.title
    year = item.year
  }

  const embedUrl = sources[srcIdx]?.getUrl(id)

  return (
    <div className="player-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="player-box">
        <div className="player-header">
          <div>
            <div className="player-title">{title}</div>
            {year && <div className="player-year">{year}</div>}
          </div>
          <button className="player-close" onClick={onClose}>✕</button>
        </div>

        <div className="player-iframe-wrap">
          <iframe
            key={`${srcIdx}-${id}`}
            className="player-iframe"
            src={embedUrl}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
        </div>

        <div className="player-sources">
          <span className="sources-label">Servers:</span>
          {sources.map((s, i) => (
            <button
              key={i}
              className={`source-btn ${srcIdx === i ? 'active' : ''}`}
              onClick={() => setSrcIdx(i)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="player-actions">
          {downloadUrl && (
            <a className="action-btn dl" href={downloadUrl} target="_blank" rel="noreferrer">
              ⬇ Download HD
            </a>
          )}
          {type === 'movie' && id && (
            <a
              className="action-btn info"
              href={`https://www.imdb.com/title/${id}/`}
              target="_blank"
              rel="noreferrer"
            >
              ★ IMDB
            </a>
          )}
          <button className="action-btn share" onClick={() => {
            navigator.clipboard?.writeText(window.location.href)
          }}>
            🔗 Share
          </button>
        </div>
      </div>
    </div>
  )
}
