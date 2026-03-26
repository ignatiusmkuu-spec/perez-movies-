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
        const [omdbMovies, omdbSeries, showboxRes] = await Promise.allSettled([
          omdbSearch(q, p),
          fetch(`/proxy/omdb/?apikey=trilogy&s=${encodeURIComponent(q)}&type=series&page=${p}`)
            .then(r => r.json())
            .then(d => (d.Search || []).map(m => ({ ...m, Poster: m.Poster !== 'N/A' ? m.Poster : null })))
            .catch(() => []),
          fetch(`/api/showbox-search?q=${encodeURIComponent(q)}&type=movie`)
            .then(r => r.json())
            .then(d => (d.items || []).map(i => ({
              Title: i.title,
              Year: String(i.year || ''),
              Genre: i.genre || '',
              Poster: i.poster || null,
              imdbID: null,
              _source: 'showbox',
              _showboxId: i.id,
              _showboxType: i.boxType || 'movie',
            })))
            .catch(() => []),
        ])

        const movies = (omdbMovies.status === 'fulfilled' ? omdbMovies.value : [])
          .map(r => ({ ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null }))
        const series = (omdbSeries.status === 'fulfilled' ? omdbSeries.value : [])
          .map(r => ({ ...r, _source: 'omdb' }))
        const showbox = showboxRes.status === 'fulfilled' ? showboxRes.value : []

        const seenTitles = new Set()
        const seenIds = new Set()
        const all = []
        for (const item of [...movies, ...series, ...showbox]) {
          const titleKey = (item.Title || '').toLowerCase().trim()
          const idKey = item.imdbID
          if ((idKey && seenIds.has(idKey)) || (titleKey && seenTitles.has(titleKey))) continue
          if (idKey) seenIds.add(idKey)
          if (titleKey) seenTitles.add(titleKey)
          all.push(item)
        }

        if (p === 1) setMovies(all)
        else setMovies(prev => {
          const ids = new Set(prev.map(m => m.imdbID).filter(Boolean))
          const titles = new Set(prev.map(m => m.Title?.toLowerCase()).filter(Boolean))
          return [...prev, ...all.filter(m => !ids.has(m.imdbID) && !titles.has(m.Title?.toLowerCase()))]
        })
        setHasMore(movies.length >= 10 || showbox.length >= 10)

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

        const [ytsResult, discoverResult] = await Promise.allSettled([
          fetchFlixerMovies(genre_param, sort_param),
          fetch(`/api/moviebox-discover?genre=${encodeURIComponent(g)}`).then(r => r.json()),
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
          .filter(i => !yts.find(m => m.Title?.toLowerCase() === i.title?.toLowerCase()))

        const combined = p === 1 ? [...discoverItems, ...yts] : yts
        if (p === 1) setMovies(combined)
        setHasMore(false)

      } else {
        // "All" tab — MovieBox Discover + YTS + Andrespecht in parallel
        const [discoverResult, ytsResult, andrespeResult] = await Promise.allSettled([
          fetch(`/api/moviebox-discover?genre=all`).then(r => r.json()),
          fetchFlixerMovies(),
          fetch('/api/andrespecht-movies').then(r => r.json()),
        ])

        // MovieBox (ShowBox) discovered movies
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

        // YTS movies
        const yts = ytsResult.status === 'fulfilled' ? (ytsResult.value || []) : []

        // Andrespecht classic movies
        const andrespeMovies = (andrespeResult.status === 'fulfilled'
          ? (andrespeResult.value?.movies || [])
          : []
        ).map(m => ({
          Title: m.title,
          Year: String(m.year || ''),
          Genre: Array.isArray(m.genre) ? m.genre.join(', ') : (m.genre || ''),
          Poster: m.poster || null,
          imdbID: null,
          _source: 'andrespecht',
          _andrespeSlug: m.slug,
          _runningTime: m.runningTime,
          _description: m.description,
        }))

        // Merge — ShowBox first (newest/popular), then YTS, then Andrespecht
        const seenTitles = new Set()
        const combined = []
        for (const m of [...discoverItems, ...yts, ...andrespeMovies]) {
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
                    key={m.imdbID || m._mbId || m._ytsId || m.subjectId || m._newtoxicSlug || m._showboxId || i}
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
