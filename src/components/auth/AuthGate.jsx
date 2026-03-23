import { useState, useEffect, createContext, useContext } from 'react'
import { authApi } from '../../api/auth'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import PricingPage from './PricingPage'
import './Auth.css'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function AuthGate({ children }) {
  const [authState, setAuthState] = useState('loading') // loading | login | register | pricing | app
  const [user, setUser] = useState(null)
  const [subActive, setSubActive] = useState(false)
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('ignite_token')
    if (!token) { setAuthState('login'); return }
    authApi.me().then(res => {
      if (!res.success) { localStorage.removeItem('ignite_token'); setAuthState('login'); return }
      setUser(res.user)
      setSubActive(res.subscriptionActive)
      setDaysLeft(res.daysRemaining || 0)
      setAuthState(res.subscriptionActive ? 'app' : 'pricing')
    }).catch(() => { localStorage.removeItem('ignite_token'); setAuthState('login') })
  }, [])

  const handleLogin = (res) => {
    setUser(res.user)
    setSubActive(res.subscriptionActive)
    setDaysLeft(res.daysRemaining || 0)
    setAuthState(res.subscriptionActive ? 'app' : 'pricing')
  }

  const handleRegister = (res) => {
    setUser(res.user)
    setSubActive(false)
    setAuthState('pricing')
  }

  const handleSubscribed = (res) => {
    setSubActive(true)
    setDaysLeft(res.daysRemaining || 0)
    if (res.subscription) setUser(prev => ({ ...prev, subscription: res.subscription }))
    setAuthState('app')
  }

  const handleLogout = () => {
    localStorage.removeItem('ignite_token')
    setUser(null)
    setSubActive(false)
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

  // Subscription active — render the app
  return (
    <AuthContext.Provider value={{ user, subActive, daysLeft, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}
