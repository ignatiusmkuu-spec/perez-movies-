import { useState, useEffect } from 'react'
import { fetchHomeData, getSectionSubjects, normalizeMbItem, omdbSearch } from '../api/moviebox'
import SectionHeader from './SectionHeader'
import MediaCard from './MediaCard'
import './MediaGrid.css'

const GENRES = [
  { label: 'Popular', value: 'Popular Series' },
  { label: 'K-Drama', value: 'K-Drama' },
  { label: 'C-Drama', value: 'C-Drama' },
  { label: 'Thai Drama', value: 'Thai-Drama' },
  { label: 'SA Drama', value: 'SA Drama' },
  { label: 'Black Shows', value: 'Black Shows' },
  { label: 'Romance', value: 'Teen Romance' },
  { label: 'Turkish', value: 'Turkish' },
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

export default function DramaSection({ searchQuery, onPlay }) {
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('Popular Series')

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        if (searchQuery) {
          const results = await omdbSearch(searchQuery, 1)
          setShows(results.map(r => ({
            ...r,
            _source: 'omdb',
            Poster: r.Poster !== 'N/A' ? r.Poster : null,
          })))
        } else {
          const sections = await fetchHomeData()
          let items = getSectionSubjects(sections, genre)
          if (items.length === 0) {
            const fallback = sections
              .filter(s => s.type === 'SUBJECTS_MOVIE' && s.subjects?.length > 0)
              .flatMap(s => s.subjects || [])
              .filter(m => m.subjectType === 2)
            items = fallback
          }
          const unique = items.filter((m, i, arr) =>
            arr.findIndex(x => x.subjectId === m.subjectId) === i
          )
          setShows(unique.map(normalizeMbItem))
        }
      } catch (e) { console.error('DramaSection:', e) }
      setLoading(false)
    }
    load()
  }, [genre, searchQuery])

  return (
    <div>
      <SectionHeader
        title={searchQuery ? `Results for "${searchQuery}"` : '📺 Drama & Series'}
        genres={!searchQuery ? GENRES : null}
        activeGenre={genre}
        onGenre={setGenre}
      />
      {loading ? (
        <Skeleton />
      ) : (
        <div className="media-grid-wrap">
          <div className="media-grid">
            {shows.length === 0
              ? <div className="no-results">No shows found. Try another category.</div>
              : shows.map((s, i) => (
                  <MediaCard
                    key={s.imdbID || s._mbId || i}
                    item={s}
                    type={s._source === 'moviebox' ? 'moviebox-tv' : 'movie'}
                    onPlay={onPlay}
                  />
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
