const BASE = '/proxy/yts'

async function safeFetch(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getLatestMovies(page = 1, genre = 'all') {
  const params = new URLSearchParams({
    limit: 20,
    page,
    sort_by: 'year',
    order_by: 'desc',
    quality: 'all',
  })
  if (genre && genre !== 'all') params.set('genre', genre)
  const data = await safeFetch(`${BASE}/list_movies.json?${params}`)
  return data.data?.movies || []
}

export async function searchMovies(query, page = 1) {
  const params = new URLSearchParams({
    query_term: query,
    limit: 20,
    page,
    sort_by: 'rating',
  })
  const data = await safeFetch(`${BASE}/list_movies.json?${params}`)
  return data.data?.movies || []
}

export async function getPopularMovies(page = 1) {
  const params = new URLSearchParams({
    limit: 20,
    page,
    sort_by: 'download_count',
    order_by: 'desc',
  })
  const data = await safeFetch(`${BASE}/list_movies.json?${params}`)
  return data.data?.movies || []
}

export async function getTopRatedMovies(page = 1) {
  const params = new URLSearchParams({
    limit: 20,
    page,
    sort_by: 'rating',
    order_by: 'desc',
    minimum_rating: 7,
  })
  const data = await safeFetch(`${BASE}/list_movies.json?${params}`)
  return data.data?.movies || []
}
