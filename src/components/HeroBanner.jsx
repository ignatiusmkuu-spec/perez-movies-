import { useState, useEffect } from 'react'
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
  const [featured, setFeatured] = useState(FALLBACK)
  const [imdbId, setImdbId] = useState(FALLBACK.imdbID)

  useEffect(() => {
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
        setFeatured({ title, year, genre, bg, desc })
        getImdbId(title, year, isTV).then(id => {
          if (id) setImdbId(id)
        })
      }
    }).catch(() => {})
  }, [])

  const handlePlay = () => {
    onPlay({
      Title: featured.title,
      Year: featured.year,
      imdbID: imdbId,
      Genre: featured.genre,
      Poster: featured.bg,
      _source: 'moviebox',
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
          <span>{featured.year}</span>
          {featured.genre && (
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
      </div>
    </div>
  )
}
