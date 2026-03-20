import { useState, useEffect, useCallback } from 'react'
import { fetchHomeData, getSectionSubjects, normalizeMbItem, omdbSearch } from '../api/moviebox'
import SectionHeader from './SectionHeader'
import MediaCard from './MediaCard'
import HeroBanner from './HeroBanner'
import './MediaGrid.css'

const GENRES = [
  { label: 'All', value: 'all' },
  { label: 'Popular', value: 'Popular Movie' },
  { label: 'Action', value: 'Action Movies' },
  { label: 'Horror', value: 'Horror Movies' },
  { label: 'Nollywood', value: 'Nollywood Movie' },
  { label: 'Romance', value: 'Teen Romance' },
  { label: 'Sci-Fi', value: 'sci-fi' },
  { label: 'Thriller', value: 'thriller' },
  { label: 'Animation', value: 'animation' },
  { label: 'Crime', value: 'crime' },
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
        const results = await omdbSearch(q, p)
        const normalized = results.map(r => ({
          ...r,
          _source: 'omdb',
          Poster: r.Poster !== 'N/A' ? r.Poster : null,
        }))
        if (p === 1) setMovies(normalized)
        else setMovies(prev => {
          const ids = new Set(prev.map(m => m.imdbID))
          return [...prev, ...normalized.filter(m => !ids.has(m.imdbID))]
        })
        setHasMore(results.length >= 10)
      } else {
        const sections = await fetchHomeData()
        let items = []
        if (g === 'all') {
          const allSections = sections.filter(s =>
            s.type === 'SUBJECTS_MOVIE' && s.subjectType !== 2 && s.subjects?.length > 0
          )
          items = allSections.flatMap(s => s.subjects || [])
        } else if (['sci-fi', 'thriller', 'animation', 'crime'].includes(g)) {
          const allMovies = sections.filter(s =>
            s.type === 'SUBJECTS_MOVIE' && s.subjects?.length > 0
          ).flatMap(s => s.subjects || [])
          items = allMovies.filter(m =>
            m.genre?.toLowerCase().includes(g.replace('-', ''))
          )
        } else {
          items = getSectionSubjects(sections, g)
        }
        const unique = items.filter((m, i, arr) =>
          arr.findIndex(x => x.subjectId === m.subjectId) === i
        )
        const normalized = unique.map(normalizeMbItem)
        if (p === 1) setMovies(normalized)
        else setMovies(prev => {
          const ids = new Set(prev.map(m => m._mbId))
          return [...prev, ...normalized.filter(m => !ids.has(m._mbId))]
        })
        setHasMore(false)
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
                    key={m.imdbID || m._mbId || i}
                    item={m}
                    type={m._source === 'moviebox' ? 'moviebox' : 'movie'}
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
