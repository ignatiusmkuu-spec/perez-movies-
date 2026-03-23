const BASE = 'https://api.jikan.moe/v4'

async function safeFetch(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const text = await res.text()
    return JSON.parse(text)
  } catch { return null }
}

export async function getTopAnime(page = 1) {
  const data = await safeFetch(`${BASE}/top/anime?page=${page}&limit=20&filter=airing`)
  return data?.data || []
}

export async function getSeasonalAnime() {
  const data = await safeFetch(`${BASE}/seasons/now?limit=20`)
  return data?.data || []
}

export async function searchAnime(query) {
  const data = await safeFetch(`${BASE}/anime?q=${encodeURIComponent(query)}&limit=20&sfw`)
  return data?.data || []
}

export async function getAnimeByGenre(genreId) {
  const data = await safeFetch(`${BASE}/anime?genres=${genreId}&limit=20&order_by=score&sort=desc`)
  return data?.data || []
}

export const ANIME_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
]
