import { useState, useEffect, useCallback } from 'react'
import './RankingsSection.css'

function RankSkeleton() {
  return (
    <div className="rankings-grid">
      {Array(12).fill(0).map((_, i) => (
        <div key={i} className="rank-card-skeleton">
          <div className="rank-num-skeleton" />
          <div className="rank-poster-skeleton" />
        </div>
      ))}
    </div>
  )
}

export default function RankingsSection({ onPlay }) {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/xcasper-ranking')
      .then(r => r.json())
      .then(data => {
        const list = data.rankingList || []
        setCategories(list)
        if (list.length > 0) setActiveCategory(list[0])
      })
      .catch(() => setError('Could not load rankings'))
      .finally(() => setLoading(false))
  }, [])

  const loadItems = useCallback((category) => {
    if (!category?.path) return
    setLoadingItems(true)
    setItems([])
    fetch(`/api/xcasper-ranking-items?path=${encodeURIComponent(category.path)}&perPage=24`)
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false))
  }, [])

  useEffect(() => {
    if (activeCategory) loadItems(activeCategory)
  }, [activeCategory, loadItems])

  const handlePlay = (item) => {
    onPlay({
      ...item,
      _source: 'xcasper-browse',
      Title: item.title,
      Year: item.releaseDate?.slice(0, 4) || '',
      Genre: item.genre,
      Poster: item.cover?.url || null,
    }, 'moviebox')
  }

  if (loading) return <div className="rankings-section"><RankSkeleton /></div>
  if (error) return <div className="rankings-section"><div className="rankings-error">{error}</div></div>

  return (
    <div className="rankings-section">
      <div className="rankings-header">
        <h2 className="rankings-title">🏆 Top Charts</h2>
        <div className="rankings-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`rankings-tab ${activeCategory?.id === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loadingItems ? (
        <RankSkeleton />
      ) : (
        <div className="rankings-grid">
          {items.map((item) => {
            const poster = item.cover?.url || null
            const title = item.title || ''
            const year = item.releaseDate?.slice(0, 4) || ''
            const rating = item.imdbRatingValue ? Number(item.imdbRatingValue).toFixed(1) : null
            const genre = item.genre?.split(',')?.[0] || ''
            return (
              <div key={item.subjectId || item.rank} className="rank-card" onClick={() => handlePlay(item)}>
                <div className="rank-number">{item.rank}</div>
                <div className="rank-poster">
                  {poster ? (
                    <img
                      src={poster}
                      alt={title}
                      loading="lazy"
                      onError={e => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className="rank-poster-fallback" style={{ display: poster ? 'none' : 'flex' }}>
                    {title}
                  </div>
                  <div className="rank-overlay">
                    <div className="rank-play">▶</div>
                  </div>
                  {rating && <div className="rank-rating">★ {rating}</div>}
                </div>
                <div className="rank-info">
                  <div className="rank-title">{title}</div>
                  <div className="rank-meta">
                    {year && <span>{year}</span>}
                    {year && genre && <span className="rank-dot">·</span>}
                    {genre && <span>{genre}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
