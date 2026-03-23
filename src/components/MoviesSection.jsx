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

const OMDB_SEEDS = ['marvel','batman','fast furious','avatar','spider','inception','mission impossible']

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
        const [ytsResult, ntResult] = await Promise.allSettled([
          fetchFlixerMovies('all', 'date_added'),
          fetch(`/api/newtoxic-latest?type=movie&page=${p}`).then(r => r.json()),
        ])
        let yts = ytsResult.status === 'fulfilled' ? (ytsResult.value || []) : []
        if (yts.length === 0) {
          try {
            const fallback = await omdbSearch('man', p)
            yts = fallback.map(r => ({
              ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null,
            }))
          } catch {}
        }
        const ntItems = (ntResult.status === 'fulfilled' ? (ntResult.value?.items || []) : [])
          .map(i => ({
            Title: i.title,
            Year: '',
            Genre: i.category,
            Poster: i.thumbnail || null,
            _source: 'newtoxic',
            _newtoxicSlug: i.slug,
            _newtoxicType: i.type || 'movie',
          }))
        const combined = p === 1 ? [...ntItems, ...yts] : yts
        if (p === 1) setMovies(combined)
        else setMovies(prev => [...prev, ...yts])
        setHasMore(yts.length >= 18)

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
        const xcasperGenre = g === 'sci-fi' ? 'Science Fiction' : g.charAt(0).toUpperCase() + g.slice(1)

        const [ytsResult, xcasperResult] = await Promise.allSettled([
          fetchFlixerMovies(genre_param, sort_param),
          g !== 'nollywood'
            ? fetch(`/api/xcasper-browse?subjectType=1&genre=${encodeURIComponent(xcasperGenre)}&perPage=24`).then(r => r.json())
            : Promise.resolve({ items: [] }),
        ])

        let yts = ytsResult.status === 'fulfilled' ? (ytsResult.value || []) : []
        if (yts.length === 0) {
          try {
            const omdbFallback = await omdbSearch(g.replace('-', ' '), p)
            yts = omdbFallback.map(r => ({
              ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null,
            }))
          } catch {}
        }

        const xcasperItems = (xcasperResult.status === 'fulfilled' ? (xcasperResult.value?.items || []) : [])
          .map(i => ({
            ...i,
            _source: 'xcasper-browse',
            Title: i.title,
            Year: i.releaseDate?.slice(0, 4) || '',
            Genre: i.genre,
            Poster: i.cover?.url || null,
          }))
          .filter(i => !yts.find(m => m.Title?.toLowerCase() === i.title?.toLowerCase()))

        const combined = p === 1 ? [...yts, ...xcasperItems] : yts
        if (p === 1) setMovies(combined)
        setHasMore(false)

      } else {
        // "All" tab — fetch MovieBox + YTS + OMDB in parallel for maximum reliability
        const [mbResult, ytsResult, ...omdbResults] = await Promise.allSettled([
          fetchHomeData(),
          fetchFlixerMovies(),
          omdbSearch(OMDB_SEEDS[0], 1),
          omdbSearch(OMDB_SEEDS[1], 1),
          omdbSearch(OMDB_SEEDS[2], 1),
        ])

        // Normalize MovieBox items — only include actual movies (subjectType === 1)
        let mbNormalized = []
        const sections = mbResult.status === 'fulfilled' ? (mbResult.value || []) : []
        if (sections.length) {
          const allSections = sections.filter(s =>
            s.type === 'SUBJECTS_MOVIE' && s.subjects?.length > 0
          )
          const mbItems = allSections.flatMap(s => s.subjects || [])
          const unique = mbItems.filter((m, i, arr) =>
            m.subjectType === 1 && arr.findIndex(x => x.subjectId === m.subjectId) === i
          )
          mbNormalized = unique.map(normalizeMbItem)
        }

        // YTS movies
        const yts = ytsResult.status === 'fulfilled' ? (ytsResult.value || []) : []

        // OMDB movies — always include (not just as fallback)
        const allOmdb = omdbResults.flatMap(r =>
          r.status === 'fulfilled' ? (r.value || []) : []
        )
        const omdbSeen = new Set()
        const omdbMovies = allOmdb
          .filter(m => { if (omdbSeen.has(m.imdbID)) return false; omdbSeen.add(m.imdbID); return true })
          .map(r => ({ ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null }))

        // Merge: OMDB first (always works), then YTS, then MovieBox (skip duplicates)
        const seenIds = new Set(omdbMovies.map(m => m.imdbID).filter(Boolean))
        const ytsFiltered = yts.filter(m => !seenIds.has(m.imdbID))
        ytsFiltered.forEach(m => m.imdbID && seenIds.add(m.imdbID))
        const mbFiltered = mbNormalized.filter(m => !seenIds.has(m.imdbID))
        let combined = [...omdbMovies, ...ytsFiltered, ...mbFiltered]

        // If still low on results, fetch more OMDB seeds
        if (combined.length < 10) {
          try {
            const extra = await Promise.all(
              OMDB_SEEDS.slice(3).map(kw => omdbSearch(kw, 1))
            )
            const extraFlat = extra.flat()
            const existingIds = new Set(combined.map(m => m.imdbID).filter(Boolean))
            const extraNorm = extraFlat
              .filter(m => !existingIds.has(m.imdbID))
              .map(r => ({ ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null }))
            combined = [...combined, ...extraNorm]
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
                    key={m.imdbID || m._mbId || m._ytsId || m.subjectId || m._newtoxicSlug || i}
                    item={m}
                    type={
                      m._source === 'yts' ? 'movie' :
                      m._source === 'xcasper-browse' ? 'moviebox' :
                      m._source === 'moviebox' ? 'moviebox' : 'movie'
                    }
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
