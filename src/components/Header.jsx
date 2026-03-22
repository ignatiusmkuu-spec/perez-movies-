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
        <div className="logo-inner">
          <span className="logo-top">
            {'IGNITE'.split('').map((ch, i) => (
              <span key={i} className="logo-char" style={{ animationDelay: `${i * 0.12}s` }}>{ch}</span>
            ))}
          </span>
          <span className="logo-bottom">MOVIES</span>
          <div className="logo-scanline" />
        </div>
        <div className="logo-signal">
          <span style={{ '--h': '6px',  '--d': '0s' }} />
          <span style={{ '--h': '12px', '--d': '0.1s' }} />
          <span style={{ '--h': '20px', '--d': '0.2s' }} />
          <span style={{ '--h': '14px', '--d': '0.3s' }} />
          <span style={{ '--h': '8px',  '--d': '0.4s' }} />
        </div>
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
