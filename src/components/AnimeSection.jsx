import { useState, useEffect } from 'react'
import { getTopAnime, searchAnime, getAnimeByGenre, ANIME_GENRES } from '../api/jikan'
import SectionHeader from './SectionHeader'
import MediaCard from './MediaCard'
import './MediaGrid.css'

const GENRES = [
  { label: 'Top Airing', value: 'top' },
  ...ANIME_GENRES.map(g => ({ label: g.name, value: String(g.id) }))
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

export default function AnimeSection({ searchQuery, onPlay }) {
  const [anime, setAnime] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('top')

  useEffect(() => {
    setLoading(true)
    const fetch = async () => {
      try {
        let data
        if (searchQuery) {
          data = await searchAnime(searchQuery)
        } else if (genre === 'top') {
          data = await getTopAnime()
        } else {
          data = await getAnimeByGenre(genre)
        }
        setAnime(data)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    fetch()
  }, [genre, searchQuery])

  return (
    <div>
      <SectionHeader
        title={searchQuery ? `Results for "${searchQuery}"` : '⚡ Anime'}
        genres={!searchQuery ? GENRES : null}
        activeGenre={genre}
        onGenre={setGenre}
      />
      {loading ? (
        <Skeleton />
      ) : (
        <div className="media-grid-wrap">
          <div className="media-grid">
            {anime.length === 0
              ? <div className="no-results">No anime found.</div>
              : anime.map(a => (
                  <MediaCard key={a.mal_id} item={a} type="anime" onPlay={onPlay} />
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
