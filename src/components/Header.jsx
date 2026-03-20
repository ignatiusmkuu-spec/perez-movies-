import { useState } from 'react'
import './Header.css'

export default function Header({ onSearch, activeTab }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <header className="header">
      <div className="logo">
        <span className="logo-top">IGNATIUS</span>
        <span className="logo-bottom">MOVIE STREAM</span>
      </div>
      {activeTab !== 'sports' && activeTab !== 'developer' && (
        <form className="search-form" onSubmit={handleSubmit}>
          <input
            className="search-input"
            type="text"
            placeholder={
              activeTab === 'anime' ? 'Search anime...' :
              activeTab === 'drama' ? 'Search drama & TV shows...' :
              'Search movies...'
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="search-btn" type="submit">🔍</button>
        </form>
      )}
    </header>
  )
}
