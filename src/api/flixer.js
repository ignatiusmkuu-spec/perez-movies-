const _cache = {}
const _cacheAt = {}
const TTL = 10 * 60 * 1000

export async function fetchFlixerMovies(genre = 'all', sort = 'download_count') {
  const key = `${genre}_${sort}`
  if (_cache[key] && Date.now() - _cacheAt[key] < TTL) return _cache[key]
  try {
    const params = new URLSearchParams()
    if (genre && genre !== 'all') params.set('genre', genre)
    if (sort && sort !== 'download_count') params.set('sort', sort)
    const qs = params.toString()
    const res = await fetch(`/api/flixer/movies${qs ? '?' + qs : ''}`)
    const text = await res.text()
    const json = JSON.parse(text)
    const movies = (json.movies || []).map(m => ({
      _source: 'yts',
      _ytsId: m.id,
      Title: m.title,
      Poster: m.poster || null,
      Year: m.year,
      Genre: m.genre || 'Movie',
      quality: m.quality || 'HD',
      imdbID: m.imdb_code || null,
      imdbRating: m.rating ? String(m.rating) : null,
    }))
    if (movies.length > 0) {
      _cache[key] = movies
      _cacheAt[key] = Date.now()
    }
    return movies
  } catch (e) {
    return _cache[key] || []
  }
}
