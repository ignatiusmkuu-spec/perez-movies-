import { useState } from 'react'
import { authApi } from '../../api/auth'
import './Auth.css'

export default function RegisterPage({ onRegister, onGoLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Full name is required.')
    if (!email.trim()) return setError('Email address is required.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const res = await authApi.register(name, email, password)
      if (!res.success) return setError(res.error || 'Registration failed. Please try again.')
      localStorage.setItem('ignite_token', res.token)
      onRegister(res)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <span className="auth-logo-text">IGNITE</span>
        <span className="auth-logo-sub">STREAMING</span>
      </div>
      <h2 className="auth-title">Create Account</h2>
      <p className="auth-subtitle">Join to unlock unlimited streaming</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label>Full Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name" autoComplete="name" />
        </div>
        <div className="auth-field">
          <label>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email" />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Min. 6 characters" autoComplete="new-password" />
        </div>
        <div className="auth-field">
          <label>Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password" autoComplete="new-password" />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <div className="auth-links">
        <span className="auth-muted">Already have an account?</span>
        <button className="auth-link" onClick={onGoLogin}>Sign in</button>
      </div>
    </div>
  )
}
