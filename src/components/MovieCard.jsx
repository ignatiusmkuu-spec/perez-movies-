import './MovieCard.css'

function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      <div className="poster-wrapper">
        <div className="poster-placeholder">
          <span className="poster-title">{movie.title}</span>
        </div>
        <div className="rating-badge">
          <span className="star">★</span> {movie.rating}
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <div className="movie-meta">
          <span className="year">{movie.year}</span>
          <span className="dot">·</span>
          <span className="genre">{movie.genre}</span>
        </div>
        <p className="movie-desc">{movie.description}</p>
      </div>
    </div>
  )
}

export default MovieCard
