const BASE = '/proxy/omdb'

async function safeFetch(url) {
  const res = await fetch(url)
  const data = await res.json()
  if (data.Response === 'False') return null
  return data
}

const BROWSE_QUERIES = {
  all: ['2025', '2024', 'action 2024', 'drama 2024', 'comedy 2024', 'thriller 2024'],
  action: ['action 2024', 'action 2025', 'action hero', 'action thriller'],
  comedy: ['comedy 2024', 'comedy 2025', 'funny movie'],
  drama: ['drama 2024', 'drama 2025', 'drama film'],
  horror: ['horror 2024', 'horror 2025', 'scary movie'],
  thriller: ['thriller 2024', 'thriller 2025'],
  romance: ['romance 2024', 'love story 2024'],
  animation: ['animation 2024', 'animated 2025', 'pixar', 'disney'],
  'sci-fi': ['sci-fi 2024', 'space 2024', 'future 2024'],
  crime: ['crime 2024', 'heist 2024', 'detective'],
  documentary: ['documentary 2024', 'documentary 2025'],
}

export async function browseMovies(genre = 'all', page = 1) {
  const queries = BROWSE_QUERIES[genre] || BROWSE_QUERIES['all']
  const queryIndex = ((page - 1) * 2) % queries.length
  const selectedQueries = [
    queries[queryIndex % queries.length],
    queries[(queryIndex + 1) % queries.length],
  ]

  const results = await Promise.allSettled(
    selectedQueries.map(q =>
      safeFetch(`${BASE}/?apikey=trilogy&s=${encodeURIComponent(q)}&type=movie&page=1`)
    )
  )

  const movies = []
  const seen = new Set()

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value?.Search) {
      for (const m of r.value.Search) {
        if (!seen.has(m.imdbID)) {
          seen.add(m.imdbID)
          movies.push(m)
        }
      }
    }
  }

  return movies
}

export async function searchMovies(query, page = 1) {
  const data = await safeFetch(
    `${BASE}/?apikey=trilogy&s=${encodeURIComponent(query)}&type=movie&page=${page}`
  )
  return data?.Search || []
}

export async function getLatestMovies(page = 1) {
  const year = page === 1 ? '2025' : '2024'
  const queries = [`movie ${year}`, `film ${year}`, `${year} release`, `new ${year}`]
  const q = queries[(page - 1) % queries.length]
  const data = await safeFetch(`${BASE}/?apikey=trilogy&s=${encodeURIComponent(q)}&type=movie&y=${year}`)
  return data?.Search || []
}

export function getMovieStreamUrl(imdbId) {
  return `https://vidsrc.to/embed/movie/${imdbId}`
}

export function getMovieDownloadUrl(imdbId) {
  return `https://yts.mx/browse-movies/${imdbId}`
}
