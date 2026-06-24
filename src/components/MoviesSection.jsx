import { useState, useEffect, useCallback } from 'react'
import { fetchXwolfPopular, fetchXwolfNowPlaying, fetchXwolfSearch } from '../api/xwolf'
import { omdbSearch } from '../api/moviebox'
import SectionHeader from './SectionHeader'
import MediaCard from './MediaCard'
import HeroBanner from './HeroBanner'
import './MediaGrid.css'

const GENRES = [
  { label: 'All',          value: 'all' },
  { label: 'Now Playing',  value: 'now-playing' },
  { label: 'Popular',      value: 'popular' },
  { label: 'Action',       value: 'action' },
  { label: 'Horror',       value: 'horror' },
  { label: 'Nollywood',    value: 'nollywood' },
  { label: 'Romance',      value: 'romance' },
  { label: 'Sci-Fi',       value: 'sci-fi' },
  { label: 'Thriller',     value: 'thriller' },
  { label: 'Animation',    value: 'animation' },
  { label: 'Crime',        value: 'crime' },
]

function Skeleton() {
  return (
    <div className="loading-grid">
      {Array(12).fill(0).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-poster" />
          <div className="skeleton-text" />
          <div className="skeleton-meta" />
        </div>
      ))}
    </div>
  )
}

export default function MoviesSection({ searchQuery, onPlay }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (g, p, q) => {
    setLoading(true)
    try {
      if (q) {
        // Search: xwolf search first, OMDB as fallback
        const [xwolfResults, omdbResults] = await Promise.allSettled([
          fetchXwolfSearch(q, p),
          omdbSearch(q, p),
        ])

        const xwolf = xwolfResults.status === 'fulfilled' ? xwolfResults.value : []
        const omdb = (omdbResults.status === 'fulfilled' ? omdbResults.value : [])
          .map(r => ({ ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null }))

        const seenTitles = new Set()
        const all = []
        for (const item of [...xwolf, ...omdb]) {
          const key = (item.Title || '').toLowerCase().trim()
          if (key && seenTitles.has(key)) continue
          if (key) seenTitles.add(key)
          all.push(item)
        }

        if (p === 1) setMovies(all)
        else setMovies(prev => {
          const titles = new Set(prev.map(m => m.Title?.toLowerCase()).filter(Boolean))
          return [...prev, ...all.filter(m => !titles.has(m.Title?.toLowerCase()))]
        })
        setHasMore(xwolf.length >= 10 || omdb.length >= 10)

      } else if (g === 'now-playing') {
        const items = await fetchXwolfNowPlaying(p)
        if (p === 1) setMovies(items)
        else setMovies(prev => {
          const titles = new Set(prev.map(m => m.Title?.toLowerCase()).filter(Boolean))
          return [...prev, ...items.filter(m => !titles.has(m.Title?.toLowerCase()))]
        })
        setHasMore(items.length >= 18)

      } else if (g === 'popular') {
        const items = await fetchXwolfPopular(p)
        if (p === 1) setMovies(items)
        else setMovies(prev => {
          const titles = new Set(prev.map(m => m.Title?.toLowerCase()).filter(Boolean))
          return [...prev, ...items.filter(m => !titles.has(m.Title?.toLowerCase()))]
        })
        setHasMore(items.length >= 18)

      } else if (g === 'nollywood') {
        const results = await omdbSearch('Nigeria film', p)
        const normalized = results.map(r => ({
          ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null,
        }))
        if (p === 1) setMovies(normalized)
        else setMovies(prev => {
          const ids = new Set(prev.map(m => m.imdbID))
          return [...prev, ...normalized.filter(m => !ids.has(m.imdbID))]
        })
        setHasMore(results.length >= 10)

      } else if (['action','horror','romance','sci-fi','thriller','animation','crime'].includes(g)) {
        // Genre tab: search xwolf by genre keyword
        const keyword = g.replace('-', ' ')
        const [xwolfResults, discoverResult] = await Promise.allSettled([
          fetchXwolfSearch(keyword, p),
          fetch(`/api/moviebox-discover?genre=${encodeURIComponent(g)}`).then(r => r.json()),
        ])

        const xwolf = xwolfResults.status === 'fulfilled' ? xwolfResults.value : []
        const discoverItems = (discoverResult.status === 'fulfilled' ? (discoverResult.value?.items || []) : [])
          .map(i => ({
            Title: i.title,
            Year: String(i.year || ''),
            Genre: i.genre || '',
            Poster: i.poster || null,
            imdbRating: i.rating || null,
            imdbID: null,
            _source: 'showbox',
            _showboxId: i.id,
            _showboxType: 'movie',
          }))
          .filter(i => !xwolf.find(m => m.Title?.toLowerCase() === i.Title?.toLowerCase()))

        const combined = [...xwolf, ...discoverItems]
        if (p === 1) setMovies(combined)
        setHasMore(xwolf.length >= 18)

      } else {
        // "All" tab: xwolf popular + showbox discover in parallel
        const [popularResult, discoverResult] = await Promise.allSettled([
          fetchXwolfPopular(p),
          fetch('/api/moviebox-discover?genre=all').then(r => r.json()),
        ])

        const xwolf = popularResult.status === 'fulfilled' ? popularResult.value : []
        const discoverItems = (discoverResult.status === 'fulfilled'
          ? (discoverResult.value?.items || []) : [])
          .map(i => ({
            Title: i.title,
            Year: String(i.year || ''),
            Genre: i.genre || '',
            Poster: i.poster || null,
            imdbRating: i.rating || null,
            imdbID: null,
            _source: 'showbox',
            _showboxId: i.id,
            _showboxType: 'movie',
          }))

        const seenTitles = new Set()
        const combined = []
        for (const m of [...xwolf, ...discoverItems]) {
          const key = (m.Title || '').toLowerCase().trim()
          if (key && seenTitles.has(key)) continue
          if (key) seenTitles.add(key)
          combined.push(m)
        }

        if (p === 1) setMovies(combined)
        setHasMore(false)
        setLoading(false)
        return
      }
    } catch (e) { console.error('MoviesSection error:', e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    setPage(1)
    load(genre, 1, searchQuery)
  }, [genre, searchQuery, load])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    load(genre, next, searchQuery)
  }

  return (
    <div>
      {!searchQuery && genre === 'all' && <HeroBanner onPlay={onPlay} />}
      <SectionHeader
        title={searchQuery ? `Results for "${searchQuery}"` : '🎬 Movies'}
        genres={!searchQuery ? GENRES : null}
        activeGenre={genre}
        onGenre={setGenre}
      />
      {loading && movies.length === 0 ? (
        <Skeleton />
      ) : (
        <div className="media-grid-wrap">
          <div className="media-grid">
            {movies.length === 0
              ? <div className="no-results">No movies found.</div>
              : movies.map((m, i) => (
                  <MediaCard
                    key={m.imdbID || m._mbId || m._xwolfId || m._showboxId || i}
                    item={m}
                    type="movie"
                    onPlay={onPlay}
                  />
                ))
            }
          </div>
          {!loading && hasMore && (
            <div className="load-more-wrap">
              <button className="load-more-btn" onClick={loadMore}>Load More</button>
            </div>
          )}
          {loading && movies.length > 0 && (
            <div className="load-more-wrap"><span style={{color:'var(--text3)'}}>Loading...</span></div>
          )}
        </div>
      )}
    </div>
  )
}
