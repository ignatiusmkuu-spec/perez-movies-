import { useState, useEffect, useCallback } from 'react'
import { browseMovies, searchMovies } from '../api/omdb'
import SectionHeader from './SectionHeader'
import MediaCard from './MediaCard'
import HeroBanner from './HeroBanner'
import './MediaGrid.css'

const GENRES = [
  { label: 'Latest', value: 'all' },
  { label: 'Action', value: 'action' },
  { label: 'Comedy', value: 'comedy' },
  { label: 'Drama', value: 'drama' },
  { label: 'Horror', value: 'horror' },
  { label: 'Sci-Fi', value: 'sci-fi' },
  { label: 'Romance', value: 'romance' },
  { label: 'Thriller', value: 'thriller' },
  { label: 'Animation', value: 'animation' },
  { label: 'Documentary', value: 'documentary' },
  { label: 'Crime', value: 'crime' },
]

function Skeleton() {
  return (
    <div className="loading-grid">
      {Array(10).fill(0).map((_, i) => (
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

  const load = useCallback(async (g, p, q) => {
    setLoading(true)
    try {
      let data
      if (q) {
        data = await searchMovies(q, p)
      } else {
        data = await browseMovies(g, p)
      }
      if (p === 1) setMovies(data)
      else setMovies(prev => {
        const ids = new Set(prev.map(m => m.imdbID))
        return [...prev, ...data.filter(m => !ids.has(m.imdbID))]
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setPage(1)
    load(genre, 1, searchQuery)
  }, [genre, searchQuery, load])

  const handleGenre = (g) => {
    setGenre(g)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    load(genre, next, searchQuery)
  }

  return (
    <div>
      {!searchQuery && genre === 'all' && <HeroBanner onPlay={onPlay} />}
      <SectionHeader
        title={searchQuery ? `Results for "${searchQuery}"` : '🎬 Latest Movies'}
        genres={!searchQuery ? GENRES : null}
        activeGenre={genre}
        onGenre={handleGenre}
      />
      {loading && movies.length === 0 ? (
        <Skeleton />
      ) : (
        <div className="media-grid-wrap">
          <div className="media-grid">
            {movies.length === 0
              ? <div className="no-results">No movies found. Try a different search.</div>
              : movies.map(m => (
                  <MediaCard key={m.imdbID} item={m} type="movie" onPlay={onPlay} />
                ))
            }
          </div>
          {!loading && (
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
