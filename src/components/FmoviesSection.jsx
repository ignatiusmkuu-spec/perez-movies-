import { useState, useEffect, useCallback, useRef } from 'react'
import './FmoviesSection.css'

const GRID_SIZE = 24
const TOTAL_PAGES = 38

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

function FmoviesPlayer({ movie, onClose }) {
  const [loading, setLoading] = useState(true)
  const fmoviesUrl = movie.fmoviesUrl || `https://ww4.fmovies.co/film/${movie.slug}/`
  const proxyUrl = `/api/fmovies-page?slug=${encodeURIComponent(movie.slug)}`

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fm-player-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fm-player-modal">
        <div className="fm-player-header">
          <div className="fm-player-title-wrap">
            <span className="fm-player-badge">FMovies</span>
            <span className="fm-player-title">{movie.title}</span>
          </div>
          <div className="fm-player-actions">
            <a
              href={fmoviesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="fm-player-external"
              title="Open in new tab"
            >
              ↗ Open in FMovies
            </a>
            <button className="fm-player-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="fm-player-frame-wrap">
          {loading && (
            <div className="fm-player-loading">
              <div className="fm-player-spinner" />
              <p>Loading FMovies…</p>
            </div>
          )}
          <iframe
            src={proxyUrl}
            className="fm-player-frame"
            title={movie.title}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation allow-pointer-lock"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  )
}

export default function FmoviesSection() {
  const [page, setPage] = useState(1)
  const [movies, setMovies] = useState([])
  const [loadingPage, setLoadingPage] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [displayCount, setDisplayCount] = useState(GRID_SIZE)
  const [activeMovie, setActiveMovie] = useState(null)
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

  const displayedMovies = movies.slice(0, displayCount)
  const hasMore = displayCount < movies.length

  return (
    <div className="fm-section">
      {activeMovie && (
        <FmoviesPlayer movie={activeMovie} onClose={() => setActiveMovie(null)} />
      )}

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
                onClick={setActiveMovie}
                loading={false}
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
