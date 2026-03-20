const BASE = '/proxy/tvmaze'

async function safeFetch(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getPopularShows() {
  const data = await safeFetch(`${BASE}/shows?page=0`)
  return Array.isArray(data) ? data.slice(0, 30) : []
}

export async function searchShows(query) {
  const data = await safeFetch(`${BASE}/search/shows?q=${encodeURIComponent(query)}`)
  return Array.isArray(data) ? data.map(r => r.show) : []
}

export async function getDramaShows() {
  const data = await safeFetch(`${BASE}/search/shows?q=drama`)
  return Array.isArray(data) ? data.map(r => r.show) : []
}

export async function getShowsByGenre(genre) {
  const data = await safeFetch(`${BASE}/search/shows?q=${encodeURIComponent(genre)}`)
  return Array.isArray(data) ? data.map(r => r.show) : []
}
