import { useState } from 'react'
import Logo from './Logo'
import { useAuth } from './auth/AuthGate'
import './Header.css'

export default function Header({ onSearch, activeTab }) {
  const [query, setQuery] = useState('')
  const auth = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  const daysLeft = auth?.daysLeft ?? 0
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7

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
      {auth && (
        <div className="header-user">
          <span className={`sub-days-badge${isExpiringSoon ? ' expiring' : ''}`}>
            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
          </span>
          <button className="header-logout-btn" onClick={auth.handleLogout} title="Sign out">
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
