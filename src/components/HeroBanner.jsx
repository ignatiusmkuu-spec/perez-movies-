import { useState, useEffect, useRef } from 'react'
import { fetchHomeData, getBannerItem, getImdbId } from '../api/moviebox'
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
    // Load newtoxic featured first (faster)
    fetch('/api/newtoxic-featured')
      .then(r => r.json())
      .then(data => {
        const ntItems = (data.items || []).map(i => ({
          title: i.title,
          year: '',
          desc: `${i.category} — Available on IgnatiusMovies`,
          bg: i.thumbnail || FALLBACK_BG,
          genre: i.category,
          _newtoxicSlug: i.slug,
          _newtoxicType: i.type,
        }))
        if (ntItems.length > 0) setItems(ntItems)
      })
      .catch(() => {})

    // Also load moviebox banner
    fetchHomeData().then(sections => {
      const item = getBannerItem(sections)
      if (item) {
        const src = item.subject || item
        const toStr = (v) => (typeof v === 'string' ? v : (Array.isArray(v) ? v[0] || '' : ''))
        const title = toStr(src.title || item.title) || FALLBACK.title
        const year = toStr(src.releaseDate).slice(0, 4) || FALLBACK.year
        const genre = toStr(src.genre) || FALLBACK.genre
        const rawBg = item.image?.url || src.cover?.url || null
        const bg = rawBg ? `/api/imgproxy?src=${encodeURIComponent(rawBg)}` : FALLBACK.bg
        const desc = toStr(src.description) || FALLBACK.desc
        const isTV = (src.subjectType || item.subjectType) === 2
        const mbItem = { title, year, genre, bg, desc }
        setItems(prev => [...prev, mbItem])
        getImdbId(title, year, isTV).then(id => {
          if (id) setImdbIds(prev => ({ ...prev, [prev.__len || 0]: id }))
        })
      }
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
    if (featured._newtoxicSlug) {
      onPlay({
        Title: featured.title,
        _newtoxicSlug: featured._newtoxicSlug,
        _newtoxicType: featured._newtoxicType || 'movie',
        Poster: featured.bg,
        _source: 'newtoxic',
      }, featured._newtoxicType === 'tv' ? 'tv' : 'movie')
    } else {
      onPlay({
        Title: featured.title,
        Year: featured.year,
        imdbID: imdbId,
        Genre: featured.genre,
        Poster: featured.bg,
        _source: 'moviebox',
      }, 'movie')
    }
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
          {featured.genre && (
            <>
              {featured.year && <span className="hero-dot">·</span>}
              <span>{featured.genre}</span>
            </>
          )}
        </div>
        <p className="hero-desc">{featured.desc}</p>
        <div className="hero-actions">
          <button className="hero-play" onClick={handlePlay}>
            ▶ Play Now
          </button>
          {imdbId && !featured._newtoxicSlug && (
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
