import { useState, useEffect, useRef } from 'react'
import { getImdbId } from '../api/moviebox'
import { fetchXwolfTrending } from '../api/xwolf'
import './HeroBanner.css'

const FALLBACK_BG = '/api/imgproxy?src=' + encodeURIComponent('https://pbcdnw.aoneroom.com/image/2026/03/19/2e7dc8ef8e55968a6217d0d82fdfa456.png')

const FALLBACK = {
  title: 'Beauty in Black',
  year: '2024',
  desc: 'A gripping drama series about power, betrayal, and secrets that bind a family together.',
  bg: FALLBACK_BG,
  imdbID: 'tt21336766',
  genre: 'Drama',
}

export default function HeroBanner({ onPlay }) {
  const [items, setItems] = useState([FALLBACK])
  const [idx, setIdx] = useState(0)
  const [imdbIds, setImdbIds] = useState({ 0: FALLBACK.imdbID })
  const timerRef = useRef(null)

  const featured = items[idx] || FALLBACK
  const imdbId = imdbIds[idx] || null

  useEffect(() => {
    fetchXwolfTrending('day').then(movies => {
      if (!movies.length) return
      // Pick top 5 trending with backdrops
      const picks = movies.filter(m => m.backdrop).slice(0, 5)
      if (!picks.length) return

      const bannerItems = picks.map(m => ({
        title: m.Title,
        year: m.Year,
        desc: m.overview || '',
        bg: m.backdrop,
        imdbID: null,
        _xwolfId: m._xwolfId,
      }))

      setItems(bannerItems)
      setImdbIds({})

      // Resolve IMDB IDs for each banner item in background
      bannerItems.forEach((item, i) => {
        getImdbId(item.title, item.year, false).then(id => {
          if (id) setImdbIds(prev => ({ ...prev, [i]: id }))
        })
      })
    }).catch(() => {})
  }, [])

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (items.length <= 1) return
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % items.length)
    }, 6000)
    return () => clearInterval(timerRef.current)
  }, [items.length])

  const handlePlay = () => {
    onPlay({
      Title: featured.title,
      Year: featured.year,
      imdbID: imdbId,
      Poster: featured.bg,
      _xwolfId: featured._xwolfId,
      _source: 'xwolf',
    }, 'movie')
  }

  return (
    <div className="hero">
      <img
        className="hero-bg-img"
        src={featured.bg}
        alt={featured.title}
        referrerPolicy="no-referrer"
        onError={e => { e.target.style.display = 'none' }}
      />
      <div className="hero-overlay">
        <div className="hero-badge">🔥 Featured</div>
        <h1 className="hero-title">{featured.title}</h1>
        <div className="hero-meta">
          {featured.year && <span>{featured.year}</span>}
          {featured.year && featured.genre && (
            <>
              <span className="hero-dot">·</span>
              <span>{featured.genre}</span>
            </>
          )}
        </div>
        <p className="hero-desc">{featured.desc}</p>
        <div className="hero-actions">
          <button className="hero-play" onClick={handlePlay}>
            ▶ Play Now
          </button>
          {imdbId && (
            <a
              className="hero-info"
              href={`https://www.imdb.com/title/${imdbId}/`}
              target="_blank"
              rel="noreferrer"
            >
              ℹ More Info
            </a>
          )}
        </div>
        {items.length > 1 && (
          <div className="hero-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={`hero-dot-btn ${i === idx ? 'active' : ''}`}
                onClick={() => { setIdx(i); clearInterval(timerRef.current) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
