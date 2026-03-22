import { useState, useEffect, useCallback } from 'react'
import { fetchHomeData, normalizeMbItem, omdbSearch } from '../api/moviebox'
import { fetchFlixerMovies } from '../api/flixer'
import SectionHeader from './SectionHeader'
import MediaCard from './MediaCard'
import HeroBanner from './HeroBanner'
import './MediaGrid.css'

const GENRES = [
  { label: 'All',       value: 'all' },
  { label: 'New Releases', value: 'new-releases' },
  { label: 'Popular',  value: 'popular' },
  { label: 'Action',   value: 'action' },
  { label: 'Horror',   value: 'horror' },
  { label: 'Nollywood', value: 'nollywood' },
  { label: 'Romance',  value: 'romance' },
  { label: 'Sci-Fi',   value: 'sci-fi' },
  { label: 'Thriller', value: 'thriller' },
  { label: 'Animation', value: 'animation' },
  { label: 'Crime',    value: 'crime' },
]

const YTS_GENRES = new Set([
  'action','horror','romance','sci-fi','thriller','animation','crime',
  'drama','comedy','adventure','documentary','biography','history',
  'mystery','fantasy','family','music','war','western','sport','popular',
])

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

      } else if (g === 'new-releases') {
        let yts = await fetchFlixerMovies('all', 'date_added')
        if (yts.length === 0) {
          try {
            const fallback = await omdbSearch('man', p)
            yts = fallback.map(r => ({
              ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null,
            }))
          } catch {}
        }
        if (p === 1) setMovies(yts)
        setHasMore(false)

      } else if (g === 'nollywood') {
        const results = await omdbSearch('Nigeria film', p)
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

      } else if (YTS_GENRES.has(g)) {
        const genre_param = g === 'popular' ? 'all' : g
        const sort_param  = g === 'popular' ? 'download_count' : 'rating'
        let yts = await fetchFlixerMovies(genre_param, sort_param)
        if (yts.length === 0) {
          try {
            const omdbFallback = await omdbSearch(g.replace('-', ' '), p)
            yts = omdbFallback.map(r => ({
              ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null,
            }))
          } catch {}
        }
        if (p === 1) setMovies(yts)
        setHasMore(false)

      } else {
        const [sections, yts] = await Promise.all([
          fetchHomeData(),
          fetchFlixerMovies(),
        ])
        let mbNormalized = []
        if (sections?.length) {
          const allSections = sections.filter(s =>
            s.type === 'SUBJECTS_MOVIE' && s.subjectType !== 2 && s.subjects?.length > 0
          )
          const mbItems = allSections.flatMap(s => s.subjects || [])
          const unique = mbItems.filter((m, i, arr) =>
            arr.findIndex(x => x.subjectId === m.subjectId) === i
          )
          mbNormalized = unique.map(normalizeMbItem)
        }
        const seen = new Set(yts.map(m => m.imdbID).filter(Boolean))
        const mbFiltered = mbNormalized.filter(m => !seen.has(m.imdbID))
        let combined = [...yts, ...mbFiltered]
        if (combined.length === 0) {
          try {
            const [r1, r2, r3] = await Promise.all([
              omdbSearch('marvel', 1),
              omdbSearch('the dark', 1),
              omdbSearch('avatar', 1),
            ])
            combined = [...r1, ...r2, ...r3]
              .filter((m, i, a) => a.findIndex(x => x.imdbID === m.imdbID) === i)
              .map(r => ({ ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null }))
          } catch {}
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
                    key={m.imdbID || m._mbId || m._ytsId || i}
                    item={m}
                    type={m._source === 'yts' ? 'movie' : m._source === 'moviebox' ? 'moviebox' : 'movie'}
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
