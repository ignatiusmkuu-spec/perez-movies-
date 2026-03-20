import { useState } from 'react'
import './App.css'
import MovieCard from './components/MovieCard'
import SearchBar from './components/SearchBar'

const SAMPLE_MOVIES = [
  {
    id: 1,
    title: 'Inception',
    year: 2010,
    genre: 'Sci-Fi',
    rating: 8.8,
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e50914?text=Inception',
  },
  {
    id: 2,
    title: 'The Dark Knight',
    year: 2008,
    genre: 'Action',
    rating: 9.0,
    description: 'When the menace known as the Joker wreaks havoc on Gotham City, Batman must accept one of the greatest psychological tests.',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e50914?text=Dark+Knight',
  },
  {
    id: 3,
    title: 'Interstellar',
    year: 2014,
    genre: 'Sci-Fi',
    rating: 8.6,
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e50914?text=Interstellar',
  },
  {
    id: 4,
    title: 'Pulp Fiction',
    year: 1994,
    genre: 'Crime',
    rating: 8.9,
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e50914?text=Pulp+Fiction',
  },
  {
    id: 5,
    title: 'The Godfather',
    year: 1972,
    genre: 'Crime',
    rating: 9.2,
    description: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e50914?text=Godfather',
  },
  {
    id: 6,
    title: 'Forrest Gump',
    year: 1994,
    genre: 'Drama',
    rating: 8.8,
    description: 'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man.',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e50914?text=Forrest+Gump',
  },
  {
    id: 7,
    title: 'The Matrix',
    year: 1999,
    genre: 'Sci-Fi',
    rating: 8.7,
    description: 'A computer hacker learns the truth about his reality and his role in the war against its controllers.',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e50914?text=The+Matrix',
  },
  {
    id: 8,
    title: 'Fight Club',
    year: 1999,
    genre: 'Drama',
    rating: 8.8,
    description: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much more.',
    poster: 'https://via.placeholder.com/300x450/1a1a2e/e50914?text=Fight+Club',
  },
]

const GENRES = ['All', 'Action', 'Crime', 'Drama', 'Sci-Fi']

function App() {
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')

  const filtered = SAMPLE_MOVIES.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase())
    const matchesGenre = selectedGenre === 'All' || movie.genre === selectedGenre
    return matchesSearch && matchesGenre
  })

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-accent">PEREZ</span> MOVIES
          </h1>
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <div className="genre-filter">
          {GENRES.map((genre) => (
            <button
              key={genre}
              className={`genre-btn ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </header>

      <main className="main">
        <div className="section-title">
          <h2>
            {selectedGenre === 'All' ? 'All Movies' : selectedGenre}
            <span className="count"> ({filtered.length})</span>
          </h2>
        </div>
        {filtered.length === 0 ? (
          <div className="no-results">No movies found matching your search.</div>
        ) : (
          <div className="movies-grid">
            {filtered.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
