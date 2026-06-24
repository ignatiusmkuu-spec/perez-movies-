function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t))
}

export function normalizeXwolfItem(m) {
  return {
    Title: m.title || 'Unknown',
    Year: String(m.year || ''),
    Poster: m.poster || null,
    backdrop: m.backdrop || null,
    imdbRating: m.rating || null,
    overview: m.overview || '',
    imdbID: null,
    _xwolfId: m.id,
    _source: 'xwolf',
  }
}

export async function fetchXwolfPopular(page = 1) {
  try {
    const r = await fetchWithTimeout(`/api/xwolf/popular?page=${page}`)
    const d = await r.json()
    return (d.movies || []).map(normalizeXwolfItem)
  } catch { return [] }
}

export async function fetchXwolfTrending(time = 'day') {
  try {
    const r = await fetchWithTimeout(`/api/xwolf/trending?time=${time}`)
    const d = await r.json()
    return (d.movies || []).map(normalizeXwolfItem)
  } catch { return [] }
}

export async function fetchXwolfNowPlaying(page = 1) {
  try {
    const r = await fetchWithTimeout(`/api/xwolf/now-playing?page=${page}`)
    const d = await r.json()
    return (d.movies || []).map(normalizeXwolfItem)
  } catch { return [] }
}

export async function fetchXwolfSearch(q, page = 1) {
  try {
    const r = await fetchWithTimeout(`/api/xwolf/search?q=${encodeURIComponent(q)}&page=${page}`)
    const d = await r.json()
    return (d.movies || []).map(normalizeXwolfItem)
  } catch { return [] }
}

export async function fetchXwolfEpisodes(id, season = 1) {
  try {
    const r = await fetchWithTimeout(`/api/xwolf/tvshow/episodes?id=${id}&season=${season}`)
    const d = await r.json()
    return d.episodes || []
  } catch { return [] }
}

export async function fetchXwolfTrailer(id) {
  try {
    const r = await fetchWithTimeout(`/api/xwolf/movie/trailer?id=${id}`)
    const d = await r.json()
    return d.trailer || null
  } catch { return null }
}
