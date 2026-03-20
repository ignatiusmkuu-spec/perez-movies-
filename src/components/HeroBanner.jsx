import './HeroBanner.css'

const FEATURED = [
  {
    title: 'Back in Action',
    year: '2025',
    desc: 'A former CIA spy couple is dragged back into the world of espionage when their cover is blown.',
    bg: 'https://m.media-amazon.com/images/M/MV5BMWQ4YWYxYTAtZTlhNC00Nzc3LWE3OWUtZjY5MThlNWNiYTBiXkEyXkFqcGc@._V1_SX1920.jpg',
    imdbID: 'tt21191806',
    genre: 'Action / Comedy',
  },
  {
    title: 'Moana 2',
    year: '2024',
    desc: "Moana embarks on an epic journey beyond the far seas after receiving an unexpected call from her ancestors.",
    bg: 'https://m.media-amazon.com/images/M/MV5BMzZkOGEzZGEtN2IzMC00MTBhLTkyZGUtMzJmZjRiYjFkMGI2XkEyXkFqcGc@._V1_SX1920.jpg',
    imdbID: 'tt11360492',
    genre: 'Animation / Adventure',
  },
]

export default function HeroBanner({ onPlay }) {
  const movie = FEATURED[0]

  return (
    <div className="hero" style={{ backgroundImage: `url(${movie.bg})` }}>
      <div className="hero-overlay">
        <div className="hero-badge">🔥 Featured</div>
        <h1 className="hero-title">{movie.title}</h1>
        <div className="hero-meta">
          <span>{movie.year}</span>
          <span className="hero-dot">·</span>
          <span>{movie.genre}</span>
        </div>
        <p className="hero-desc">{movie.desc}</p>
        <div className="hero-actions">
          <button
            className="hero-play"
            onClick={() => onPlay({ Title: movie.title, Year: movie.year, imdbID: movie.imdbID })}
          >
            ▶ Play Now
          </button>
          <a
            className="hero-info"
            href={`https://www.imdb.com/title/${movie.imdbID}/`}
            target="_blank"
            rel="noreferrer"
          >
            ℹ More Info
          </a>
        </div>
      </div>
    </div>
  )
}
