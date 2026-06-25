import { useState, useEffect, useCallback } from 'react'
import { fetchXwolfPopular, fetchXwolfNowPlaying, fetchXwolfSearch } from '../api/xwolf'
import { fetchFlixerMovies } from '../api/flixer'
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

function dedup(movies) {
  const seenImdb = new Set()
  const seenTitle = new Set()
  return movies.filter(m => {
    const id = m.imdbID
    const titleKey = `${(m.Title || '').toLowerCase().trim()}|${m.Year || ''}`
    if (id && seenImdb.has(id)) return false
    if (id) seenImdb.add(id)
    if (titleKey !== '|' && seenTitle.has(titleKey)) return false
    if (titleKey !== '|') seenTitle.add(titleKey)
    return true
  })
}

function normalizeDiscover(i) {
  return {
    Title: i.title,
    Year: String(i.year || ''),
    Genre: i.genre || '',
    Poster: i.poster || null,
    imdbRating: i.rating || null,
    imdbID: null,
    _source: 'showbox',
    _showboxId: i.id,
    _showboxType: 'movie',
  }
}

async function getDiscover(genre) {
  try {
    const r = await fetch(`/api/moviebox-discover?genre=${encodeURIComponent(genre)}`)
    const d = await r.json()
    return (d.items || []).map(normalizeDiscover)
  } catch { return [] }
}

async function getOmdbBrowse(genre, page) {
  try {
    const r = await fetch(`/api/omdb/browse?genre=${encodeURIComponent(genre)}&page=${page}`)
    const d = await r.json()
    return (d.movies || []).map(m => ({ ...m, _source: 'omdb' }))
  } catch { return [] }
}

export default function MoviesSection({ searchQuery, onPlay }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(async (g, p, q) => {
    setLoading(true)
    try {
      let combined = []

      if (q) {
        const [xwolfRes, omdbRes] = await Promise.allSettled([
          fetchXwolfSearch(q, p),
          omdbSearch(q, p),
        ])
        const xwolf = xwolfRes.status === 'fulfilled' ? xwolfRes.value : []
        const omdb  = (omdbRes.status === 'fulfilled' ? omdbRes.value : [])
          .map(r => ({ ...r, _source: 'omdb', Poster: r.Poster !== 'N/A' ? r.Poster : null }))
        combined = dedup([...xwolf, ...omdb])
        setHasMore(xwolf.length >= 10 || omdb.length >= 10)

      } else if (g === 'now-playing') {
        const [xwolfRes, ytsRes, omdbRes] = await Promise.allSettled([
          fetchXwolfNowPlaying(p),
          fetchFlixerMovies('all', 'date_added'),
          getOmdbBrowse('now-playing', p),
        ])
        const xwolf = xwolfRes.status === 'fulfilled' ? xwolfRes.value : []
        const yts   = ytsRes.status   === 'fulfilled' ? ytsRes.value   : []
        const omdb  = omdbRes.status  === 'fulfilled' ? omdbRes.value  : []
        combined = dedup([...xwolf, ...yts, ...omdb])
        setHasMore(combined.length >= 20)

      } else if (g === 'popular') {
        const [xwolfRes, ytsRes, omdbRes] = await Promise.allSettled([
          fetchXwolfPopular(p),
          fetchFlixerMovies('all', 'download_count'),
          getOmdbBrowse('popular', p),
        ])
        const xwolf = xwolfRes.status === 'fulfilled' ? xwolfRes.value : []
        const yts   = ytsRes.status   === 'fulfilled' ? ytsRes.value   : []
        const omdb  = omdbRes.status  === 'fulfilled' ? omdbRes.value  : []
        combined = dedup([...xwolf, ...yts, ...omdb])
        setHasMore(combined.length >= 20)

      } else if (g === 'nollywood') {
        const [omdbRes, discoverRes] = await Promise.allSettled([
          getOmdbBrowse('nollywood', p),
          getDiscover('nollywood'),
        ])
        const omdb    = omdbRes.status    === 'fulfilled' ? omdbRes.value    : []
        const discover= discoverRes.status=== 'fulfilled' ? discoverRes.value: []
        combined = dedup([...omdb, ...discover])
        setHasMore(omdb.length >= 30)

      } else if (['action','horror','romance','sci-fi','thriller','animation','crime'].includes(g)) {
        const [xwolfRes, ytsRes, omdbRes, discoverRes] = await Promise.allSettled([
          fetchXwolfSearch(g.replace('-', ' '), p),
          fetchFlixerMovies(g, 'download_count'),
          getOmdbBrowse(g, p),
          getDiscover(g),
        ])
        const xwolf  = xwolfRes.status    === 'fulfilled' ? xwolfRes.value    : []
        const yts    = ytsRes.status      === 'fulfilled' ? ytsRes.value      : []
        const omdb   = omdbRes.status     === 'fulfilled' ? omdbRes.value     : []
        const discover=discoverRes.status === 'fulfilled' ? discoverRes.value : []
        combined = dedup([...xwolf, ...yts, ...omdb, ...discover])
        setHasMore(combined.length >= 20)

      } else {
        const [xwolfRes, ytsRes, omdbRes, discoverRes] = await Promise.allSettled([
          fetchXwolfPopular(p),
          fetchFlixerMovies('all', 'download_count'),
          getOmdbBrowse('all', p),
          getDiscover('all'),
        ])
        const xwolf  = xwolfRes.status    === 'fulfilled' ? xwolfRes.value    : []
        const yts    = ytsRes.status      === 'fulfilled' ? ytsRes.value      : []
        const omdb   = omdbRes.status     === 'fulfilled' ? omdbRes.value     : []
        const discover=discoverRes.status === 'fulfilled' ? discoverRes.value : []
        combined = dedup([...xwolf, ...yts, ...omdb, ...discover])
        setHasMore(false)
      }

      if (p === 1) {
        setMovies(combined)
      } else {
        setMovies(prev => {
          const existKeys = new Set(prev.map(m =>
            m.imdbID || m._xwolfId || m._ytsId || m._showboxId || m.Title
          ).filter(Boolean))
          return [...prev, ...combined.filter(m => {
            const key = m.imdbID || m._xwolfId || m._ytsId || m._showboxId || m.Title
            return key && !existKeys.has(key)
          })]
        })
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
