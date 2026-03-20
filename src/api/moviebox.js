const MB = '/api/moviebox'
const OMDB = '/proxy/omdb'

let _homeCache = null
let _homeCacheAt = 0
const TTL = 8 * 60 * 1000

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

export async function getImdbId(title, year, isTV = false) {
  try {
    const type = isTV ? '&type=series' : '&type=movie'
    const y = year ? `&y=${year}` : ''
    const res = await fetch(`${OMDB}/?apikey=trilogy&t=${encodeURIComponent(title)}${y}${type}`)
    const data = await res.json()
    if (data.Response === 'True') return data.imdbID
    const res2 = await fetch(`${OMDB}/?apikey=trilogy&s=${encodeURIComponent(title)}${type}`)
    const data2 = await res2.json()
    return data2.Search?.[0]?.imdbID || null
  } catch { return null }
}

export async function omdbSearch(keyword, page = 1) {
  const res = await fetch(`${OMDB}/?apikey=trilogy&s=${encodeURIComponent(keyword)}&page=${page}`)
  const data = await res.json()
  return data.Search || []
}

function proxyImg(url) {
  if (!url) return null
  return `/api/imgproxy?src=${encodeURIComponent(url)}`
}

export function normalizeMbItem(item) {
  const rawPoster = item.cover?.url || item.image?.url || null
  return {
    _mbId: item.subjectId,
    _mbType: item.subjectType,
    Title: item.title,
    Year: item.releaseDate?.slice(0, 4) || '',
    Genre: item.genre || '',
    Poster: proxyImg(rawPoster),
    imdbRating: item.imdbRatingValue || null,
    imdbID: null,
    _detailPath: item.detailPath,
    _source: 'moviebox',
  }
}
