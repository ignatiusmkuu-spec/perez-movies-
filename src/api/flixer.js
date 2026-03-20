let _cache = null
let _cacheAt = 0
const TTL = 10 * 60 * 1000

export async function fetchFlixerMovies() {
  if (_cache && Date.now() - _cacheAt < TTL) return _cache
  try {
    const res = await fetch('/api/flixer/movies')
    const json = await res.json()
    const movies = (json.movies || []).map(m => ({
      _source: 'flixer',
      _flixerId: m.id,
      Title: m.title,
      Poster: m.poster,
      Year: m.year,
      Genre: 'Movie',
      quality: m.quality,
      href: m.href,
      imdbID: null,
    }))
    _cache = movies
    _cacheAt = Date.now()
    return movies
  } catch (e) {
    return _cache || []
  }
}
