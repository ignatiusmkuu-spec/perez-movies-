const MB = '/api/moviebox'
const OMDB = '/proxy/omdb'

let _homeCache = null
let _homeCacheAt = 0
const TTL = 8 * 60 * 1000

function proxyImg(url) {
  if (!url) return null
  return `/api/imgproxy?src=${encodeURIComponent(url)}`
}

function toStr(v) {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.find(x => typeof x === 'string') || ''
  return ''
}

export async function fetchHomeData() {
  if (_homeCache && Date.now() - _homeCacheAt < TTL) return _homeCache
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${MB}/home`, { signal: controller.signal })
    clearTimeout(timeout)
    const text = await res.text()
    const json = JSON.parse(text)
    const sections = json?.data?.operatingList || []
    _homeCache = sections
    _homeCacheAt = Date.now()
    return sections
  } catch (e) {
    clearTimeout(timeout)
    return _homeCache || []
  }
}

export function getSectionSubjects(sections, titleKeyword) {
  const kw = titleKeyword.toLowerCase()
  const sec = sections.find(s =>
    s.title?.toLowerCase().includes(kw) && s.subjects?.length > 0
  )
  return sec?.subjects || []
}

export function getBannerItem(sections) {
  const bannerSec = sections.find(s => s.type === 'BANNER' && s.banner?.items?.length > 0)
  if (bannerSec) return bannerSec.banner.items[0]
  const firstMovie = sections.find(s => s.type === 'SUBJECTS_MOVIE' && s.subjects?.length > 0)
  return firstMovie?.subjects?.[0] || null
}

async function _omdbFetch(params) {
  try {
    const qs = new URLSearchParams({ apikey: 'trilogy', ...params }).toString()
    const r = await fetch(`${OMDB}/?${qs}`)
    const text = await r.text()
    return JSON.parse(text)
  } catch { return {} }
}

export async function getImdbId(title, year, isTV = false) {
  const movieType = isTV ? 'series' : 'movie'
  const y = year ? String(year) : ''

  const attempt = async (params) => {
    const d = await _omdbFetch(params)
    if (d.Response === 'True' && d.imdbID) return d.imdbID
    if (d.Search?.[0]?.imdbID) return d.Search[0].imdbID
    return null
  }

  const cleanTitle = title.split(':')[0].split('(')[0].trim()

  const strategies = [
    { t: title,      ...(y && { y }), type: movieType },
    { t: title,      ...(y && { y })                  },
    { t: title,                        type: movieType },
    { s: title,                        type: movieType },
    { s: title                                         },
    ...(cleanTitle !== title ? [
      { t: cleanTitle, ...(y && { y }), type: movieType },
      { s: cleanTitle,                  type: movieType },
    ] : []),
  ]

  for (const params of strategies) {
    const id = await attempt(params)
    if (id) return id
  }

  return null
}

export async function omdbSearch(keyword, page = 1) {
  try {
    const res = await fetch(`${OMDB}/?apikey=trilogy&s=${encodeURIComponent(keyword)}&page=${page}`)
    const text = await res.text()
    const data = JSON.parse(text)
    return (data.Search || []).map(m => ({
      ...m,
      Poster: m.Poster && m.Poster !== 'N/A' ? proxyImg(m.Poster) : null,
    }))
  } catch {
    return []
  }
}

export function normalizeMbItem(item) {
  const rawPoster = item.cover?.url || item.image?.url || null
  return {
    _mbId: item.subjectId,
    _mbType: item.subjectType,
    Title: toStr(item.title) || 'Unknown',
    Year: toStr(item.releaseDate).slice(0, 4) || '',
    Genre: toStr(item.genre),
    Poster: proxyImg(rawPoster),
    imdbRating: item.imdbRatingValue != null ? String(item.imdbRatingValue) : null,
    imdbID: null,
    _detailPath: item.detailPath,
    _source: 'moviebox',
  }
}
