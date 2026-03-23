import { useState, useEffect } from 'react'
import { fetchHomeData, getSectionSubjects, normalizeMbItem, omdbSearch } from '../api/moviebox'
import { getPopularShows, getShowsByGenre, searchShows } from '../api/tvmaze'
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

const TVMAZE_QUERY = {
  'Popular Series': null,
  'K-Drama': 'korean drama',
  'C-Drama': 'chinese drama',
  'Thai-Drama': 'thai drama',
  'SA Drama': 'south african drama',
  'Black Shows': 'black show',
  'Teen Romance': 'romance',
  'Turkish': 'turkish drama',
}

const XCASPER_BROWSE = {
  'K-Drama': { subjectType: 2, genre: 'Drama', countryName: 'South Korea' },
  'C-Drama': { subjectType: 2, genre: 'Drama', countryName: 'China' },
  'Turkish': { subjectType: 2, genre: 'Drama', countryName: 'Turkey' },
}

async function fetchXcasperBrowse({ subjectType, genre, countryName }) {
  const params = new URLSearchParams({ subjectType, genre, countryName, perPage: 24 })
  const res = await fetch(`/api/xcasper-browse?${params}`)
  const json = await res.json()
  return (json?.items || []).map(i => ({
    ...i,
    _source: 'xcasper-browse',
    Title: i.title,
    Year: i.releaseDate?.slice(0, 4) || '',
    Genre: i.genre,
    Poster: i.cover?.url || null,
  }))
}

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
          const [mbResults, tvResults] = await Promise.allSettled([
            omdbSearch(searchQuery, 1),
            searchShows(searchQuery),
          ])
          const mb = mbResults.status === 'fulfilled' ? mbResults.value.map(r => ({ ...r, _source: 'omdb', Poster: r.Poster || null })) : []
          const tv = tvResults.status === 'fulfilled' ? tvResults.value : []
          setShows(mb.length > 0 ? mb : tv.map(s => ({ ...s, _source: 'tv' })))
        } else if (XCASPER_BROWSE[genre]) {
          const [browseResult, tvShows] = await Promise.allSettled([
            fetchXcasperBrowse(XCASPER_BROWSE[genre]),
            getShowsByGenre(TVMAZE_QUERY[genre] || genre),
          ])
          const browse = browseResult.status === 'fulfilled' ? (browseResult.value || []) : []
          if (browse.length > 0) {
            setShows(browse)
          } else {
            const tv = tvShows.status === 'fulfilled' ? (tvShows.value || []) : []
            setShows(tv.map(s => ({ ...s, _source: 'tv' })))
          }
        } else {
          const [mbSections, tvShows] = await Promise.allSettled([
            fetchHomeData(),
            TVMAZE_QUERY[genre] === null ? getPopularShows() : getShowsByGenre(TVMAZE_QUERY[genre] || genre),
          ])

          let mbItems = []
          if (mbSections.status === 'fulfilled') {
            const sections = mbSections.value || []
            const raw = getSectionSubjects(sections, genre)
            if (raw.length === 0) {
              const all = sections
                .filter(s => s.type === 'SUBJECTS_MOVIE' && s.subjects?.length > 0)
                .flatMap(s => s.subjects || [])
                .filter(m => m.subjectType === 2)
              mbItems = all
            } else {
              mbItems = raw
            }
          }

          const unique = mbItems.filter((m, i, arr) =>
            arr.findIndex(x => x.subjectId === m.subjectId) === i
          )
          const normalized = unique.map(normalizeMbItem)

          if (normalized.length > 0) {
            setShows(normalized)
          } else {
            const tv = tvShows.status === 'fulfilled' ? (tvShows.value || []) : []
            setShows(tv.map(s => ({ ...s, _source: 'tv' })))
          }
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
                    key={s.imdbID || s._mbId || s.subjectId || s.id || i}
                    item={s}
                    type={
                      s._source === 'xcasper-browse' ? 'moviebox-tv' :
                      s._source === 'moviebox' ? 'moviebox-tv' :
                      s._source === 'tv' ? 'tv' : 'movie'
                    }
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
