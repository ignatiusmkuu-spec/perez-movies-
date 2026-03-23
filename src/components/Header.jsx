import { useState } from 'react'
import Logo from './Logo'
import './Header.css'

export default function Header({ onSearch, activeTab }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <header className="header">
      <Logo />
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
