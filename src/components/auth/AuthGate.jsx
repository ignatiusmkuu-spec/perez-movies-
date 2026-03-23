import { useState, useEffect } from 'react'
import { authApi } from '../../api/auth'
import { AuthContext } from './authContext'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import PricingPage from './PricingPage'
import './Auth.css'


function calcDaysLeft(user) {
  if (user?.role === 'developer') return 99999
  const expiry = user?.subscription?.expiresAt
  if (!expiry) return 0
  const diff = new Date(expiry) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function isSubActive(user) {
  if (user?.role === 'developer') return true
  const expiry = user?.subscription?.expiresAt
  if (!expiry) return false
  return new Date(expiry) > new Date()
}

export default function AuthGate({ children }) {
  const [authState, setAuthState] = useState('loading')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('ignite_token')
    if (!token) { setAuthState('login'); return }
    authApi.me().then(res => {
      if (!res.success) { localStorage.removeItem('ignite_token'); setAuthState('login'); return }
      setUser(res.user)
      setAuthState(isSubActive(res.user) ? 'app' : 'pricing')
    }).catch(() => { localStorage.removeItem('ignite_token'); setAuthState('login') })
  }, [])

  const handleLogin = (res) => {
    setUser(res.user)
    setAuthState(isSubActive(res.user) ? 'app' : 'pricing')
  }

  const handleRegister = (res) => {
    setUser(res.user)
    setAuthState('pricing')
  }

  const handleSubscribed = (res) => {
    setUser(prev => ({
      ...prev,
      subscription: res.subscription || prev?.subscription,
    }))
    setAuthState('app')
  }

  const handleLogout = () => {
    localStorage.removeItem('ignite_token')
    setUser(null)
    setAuthState('login')
  }

  if (authState === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="poll-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (authState === 'login') {
    return (
      <div className="auth-screen">
        <LoginPage
          onLogin={handleLogin}
          onGoRegister={() => setAuthState('register')}
        />
      </div>
    )
  }

  if (authState === 'register') {
    return (
      <div className="auth-screen">
        <RegisterPage
          onRegister={handleRegister}
          onGoLogin={() => setAuthState('login')}
        />
      </div>
    )
  }

  if (authState === 'pricing') {
    return (
      <div className="auth-screen">
        <PricingPage user={user} onSubscribed={handleSubscribed} />
      </div>
    )
  }

  const daysLeft = calcDaysLeft(user)
  const subActive = isSubActive(user)

  return (
    <AuthContext.Provider value={{ user, subActive, daysLeft, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}
