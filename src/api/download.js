export async function fetchDownloads({ title, year, imdb, type, season, episode }) {
  const params = new URLSearchParams()
  if (title)   params.set('title', title)
  if (year)    params.set('year', year)
  if (imdb)    params.set('imdb', imdb)
  if (type)    params.set('type', type)
  if (season)  params.set('season', season)
  if (episode) params.set('episode', episode)

  const res = await fetch(`/api/download?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const QUALITY_ORDER = ['4K', '1080p', '720p', '480p', '360p', 'SD']

export function groupByQuality(results) {
  const map = {}
  for (const r of results) {
    const q = r.quality
    if (!map[q]) map[q] = []
    map[q].push(r)
  }
  const grouped = []
  for (const q of QUALITY_ORDER) {
    if (map[q]) grouped.push({ quality: q, items: map[q] })
  }
  return grouped
}
