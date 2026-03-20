import { useState, useEffect } from 'react'
import { getPopularShows, searchShows, getShowsByGenre } from '../api/tvmaze'
import SectionHeader from './SectionHeader'
import MediaCard from './MediaCard'
import './MediaGrid.css'

const GENRES = [
  { label: 'Popular', value: 'popular' },
  { label: 'Drama', value: 'drama' },
  { label: 'Crime', value: 'crime' },
  { label: 'Romance', value: 'romance' },
  { label: 'Thriller', value: 'thriller' },
  { label: 'Comedy', value: 'comedy' },
  { label: 'Horror', value: 'horror' },
  { label: 'Fantasy', value: 'fantasy' },
  { label: 'K-Drama', value: 'korean' },
  { label: 'Turkish', value: 'turkish' },
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
  const [genre, setGenre] = useState('popular')

  useEffect(() => {
    setLoading(true)
    const fetch = async () => {
      try {
        let data
        if (searchQuery) {
          data = await searchShows(searchQuery)
        } else if (genre === 'popular') {
          data = await getPopularShows()
        } else {
          data = await getShowsByGenre(genre)
        }
        setShows(data.filter(Boolean))
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    fetch()
  }, [genre, searchQuery])

  return (
    <div>
      <SectionHeader
        title={searchQuery ? `Results for "${searchQuery}"` : '📺 Drama & TV Shows'}
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
              ? <div className="no-results">No shows found.</div>
              : shows.map(s => (
                  <MediaCard key={s.id} item={s} type="tv" onPlay={onPlay} />
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
