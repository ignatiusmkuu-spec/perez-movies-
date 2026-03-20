import { useState, useEffect } from 'react'
import { fetchHomeData, getSectionSubjects, normalizeMbItem, omdbSearch } from '../api/moviebox'
import { getTopAnime, searchAnime, getAnimeByGenre, ANIME_GENRES } from '../api/jikan'
import SectionHeader from './SectionHeader'
import MediaCard from './MediaCard'
import './MediaGrid.css'

const GENRES = [
  { label: 'Top Airing', value: 'top' },
  { label: 'MovieBox Picks', value: 'mb' },
  ...ANIME_GENRES.slice(0, 8).map(g => ({ label: g.name, value: String(g.id) })),
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
    const load = async () => {
      try {
        if (searchQuery) {
          const data = await searchAnime(searchQuery)
          setAnime(data)
        } else if (genre === 'mb') {
          const sections = await fetchHomeData()
          const mbItems = getSectionSubjects(sections, 'Anime')
          const unique = mbItems.filter((m, i, arr) =>
            arr.findIndex(x => x.subjectId === m.subjectId) === i
          )
          setAnime(unique.map(item => ({
            ...normalizeMbItem(item),
            _animeSource: 'moviebox',
          })))
        } else if (genre === 'top') {
          const data = await getTopAnime()
          setAnime(data)
        } else {
          const data = await getAnimeByGenre(genre)
          setAnime(data)
        }
      } catch (e) { console.error('AnimeSection:', e) }
      setLoading(false)
    }
    load()
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
              : anime.map((a, i) => (
                  <MediaCard
                    key={a.mal_id || a._mbId || i}
                    item={a}
                    type={a._animeSource === 'moviebox' ? 'moviebox' : 'anime'}
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
