const BASE = '/proxy/tvmaze'

async function safeFetch(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const text = await res.text()
    return JSON.parse(text)
  } catch { return null }
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
