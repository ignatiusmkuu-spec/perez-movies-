import { useState } from 'react'
import Logo from './Logo'
import { useAuth } from './auth/authContext'
import './Header.css'

export default function Header({ onSearch, activeTab }) {
  const [query, setQuery] = useState('')
  const auth = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  const daysLeft = auth?.daysLeft ?? 0
  const plan = auth?.user?.subscription?.plan
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7
  const isExpired = daysLeft === 0

  const planLabel = plan
    ? plan === '1month' ? '1 Month'
    : plan === '2months' ? '2 Months'
    : plan === '5months' ? '5 Months'
    : plan === '1year' ? '1 Year'
    : plan === 'developer' ? 'Dev'
    : plan
    : null

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
          <div className={`sub-days-badge${isExpiringSoon ? ' expiring' : ''}${isExpired ? ' expired' : ''}`}>
            {planLabel && <span className="sub-plan-name">{planLabel}</span>}
            <span className="sub-days-count">
              {isExpired ? 'Expired' : daysLeft >= 99999 ? '∞ access' : `${daysLeft}d left`}
            </span>
          </div>
          <button className="header-logout-btn" onClick={auth.handleLogout} title="Sign out">
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
