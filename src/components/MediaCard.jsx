import './MediaCard.css'

export default function MediaCard({ item, type, onPlay }) {
  let poster, title, rating, year, genre, downloadUrl, imdbId

  if (type === 'movie') {
    poster = item.Poster !== 'N/A' ? item.Poster : null
    title = item.Title
    rating = item.imdbRating && item.imdbRating !== 'N/A' ? item.imdbRating : null
    year = item.Year
    genre = item.Genre?.split(',')?.[0]
    imdbId = item.imdbID
    downloadUrl = imdbId ? `https://yts.mx/browse-movies` : null
  } else if (type === 'tv') {
    poster = item.image?.medium || item.image?.original
    title = item.name
    rating = item.rating?.average
    year = item.premiered?.slice(0, 4)
    genre = item.genres?.[0]
    imdbId = item.externals?.imdb
  } else if (type === 'anime') {
    poster = item.images?.jpg?.image_url
    title = item.title_english || item.title
    rating = item.score
    year = item.year || item.aired?.prop?.from?.year
    genre = item.genres?.[0]?.name
  }

  return (
    <div className="media-card">
      <div className="card-poster">
        {poster
          ? <img src={poster} alt={title} loading="lazy" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
          : null
        }
        <div className="card-poster-fallback" style={{display: poster ? 'none' : 'flex'}}>{title}</div>
        {rating && <div className="card-rating">★ {Number(rating).toFixed(1)}</div>}
        <div className="card-overlay">
          <button className="overlay-play" onClick={() => onPlay(item)}>▶</button>
          {type === 'movie' && imdbId && (
            <a
              className="overlay-dl"
              href={`https://www.imdb.com/title/${imdbId}/`}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
            >
              ℹ Info
            </a>
          )}
        </div>
      </div>
      <div className="card-info">
        <div className="card-title">{title}</div>
        <div className="card-meta">
          {year && <span>{year}</span>}
          {year && genre && <span className="card-dot">·</span>}
          {genre && <span className="card-genre">{genre}</span>}
        </div>
      </div>
    </div>
  )
}
