import { useState, useEffect, useCallback, useRef } from 'react'
import './FmoviesSection.css'

const GRID_SIZE = 24
const TOTAL_PAGES = 38

function slugToTitle(slug) {
  const parts = slug.split('-')
  const titleParts = parts[parts.length - 1].match(/^\d+$/) ? parts.slice(0, -1) : parts
  return titleParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function MovieCard({ movie, onClick, loading }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div className={`fm-card ${loading ? 'fm-card-loading' : ''}`} onClick={() => onClick(movie)}>
      <div className="fm-poster-wrap">
        {!imgErr ? (
          <img
            className="fm-poster"
            src={movie.poster}
            alt={movie.title}
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="fm-poster-fallback">
            <span>🎬</span>
            <span className="fm-fallback-title">{movie.title}</span>
          </div>
        )}
        <div className="fm-play-overlay">
          <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        {loading && <div className="fm-card-spinner" />}
      </div>
      <div className="fm-card-title">{movie.title}</div>
    </div>
  )
}

export default function FmoviesSection({ onPlay }) {
  const [page, setPage] = useState(1)
  const [movies, setMovies] = useState([])
  const [loadingPage, setLoadingPage] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [displayCount, setDisplayCount] = useState(GRID_SIZE)
  const [loadingMovie, setLoadingMovie] = useState(null)
  const searchTimer = useRef(null)

  const loadMovies = useCallback(async (pg, srch) => {
    setLoadingPage(true)
    setError(null)
    setDisplayCount(GRID_SIZE)
    try {
      const params = new URLSearchParams({ page: pg })
      if (srch) params.set('search', srch)
      const r = await fetch(`/api/fmovies?${params}`)
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setMovies(data.movies || [])
    } catch {
      setError('Failed to load FMovies content. Please try again.')
      setMovies([])
    } finally {
      setLoadingPage(false)
    }
  }, [])

  useEffect(() => {
    loadMovies(page, search)
  }, [page, search, loadMovies])

  const handleSearchInput = (val) => {
    setSearchInput(val)
    clearTimeout(searchTimer.current)
    if (!val.trim()) {
      setSearch('')
      return
    }
    searchTimer.current = setTimeout(() => {
      setSearch(val.trim())
      setPage(1)
    }, 400)
  }

  const handleMovieClick = async (movie) => {
    setLoadingMovie(movie.id)
    try {
      const title = movie.title
      const r = await fetch(`/api/imdb-lookup?t=${encodeURIComponent(title)}&type=movie`)
      const data = await r.json()
      const imdbID = data.imdbID || null
      onPlay({
        title: movie.title,
        poster: movie.poster,
        imdbID,
        _fmoviesSlug: movie.slug,
      }, 'movie')
    } catch {
      onPlay({
        title: movie.title,
        poster: movie.poster,
        imdbID: null,
        _fmoviesSlug: movie.slug,
      }, 'movie')
    } finally {
      setLoadingMovie(null)
    }
  }

  const displayedMovies = movies.slice(0, displayCount)
  const hasMore = displayCount < movies.length

  return (
    <div className="fm-section">
      <div className="fm-hero">
        <div className="fm-hero-left">
          <div className="fm-hero-icon">🎬</div>
          <div>
            <div className="fm-hero-title">FMovies Catalog</div>
            <div className="fm-hero-sub">38,000+ movies — browse & stream instantly</div>
          </div>
        </div>
      </div>

      <div className="fm-controls">
        <div className="fm-search-box">
          <span className="fm-search-icon">🔍</span>
          <input
            type="text"
            className="fm-search-input"
            placeholder="Search movies…"
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
          />
          {searchInput && (
            <button className="fm-search-clear" onClick={() => { setSearchInput(''); setSearch('') }}>✕</button>
          )}
        </div>

        <div className="fm-page-nav">
          <button
            className="fm-page-btn"
            onClick={() => { setPage(p => Math.max(1, p - 1)); setSearch(''); setSearchInput('') }}
            disabled={page <= 1 || loadingPage}
          >‹</button>
          <span className="fm-page-label">Page {page} of {TOTAL_PAGES}</span>
          <button
            className="fm-page-btn"
            onClick={() => { setPage(p => Math.min(TOTAL_PAGES, p + 1)); setSearch(''); setSearchInput('') }}
            disabled={page >= TOTAL_PAGES || loadingPage}
          >›</button>
        </div>
      </div>

      {error && (
        <div className="fm-error">
          ⚠ {error}
          <button onClick={() => loadMovies(page, search)}>Retry</button>
        </div>
      )}

      {loadingPage ? (
        <div className="fm-grid">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <div key={i} className="fm-card fm-card-skel">
              <div className="fm-poster-wrap fm-skel-poster" />
              <div className="fm-skel-title" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {movies.length === 0 && !error && (
            <div className="fm-empty">No movies found{search ? ` for "${search}"` : ''}.</div>
          )}
          <div className="fm-grid">
            {displayedMovies.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={handleMovieClick}
                loading={loadingMovie === movie.id}
              />
            ))}
          </div>
          {hasMore && (
            <div className="fm-load-more-wrap">
              <button className="fm-load-more" onClick={() => setDisplayCount(c => c + GRID_SIZE)}>
                Load more ({movies.length - displayCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
