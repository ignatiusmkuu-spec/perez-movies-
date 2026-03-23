import { useState } from 'react'
import { authApi } from '../../api/auth'
import './Auth.css'

export default function LoginPage({ onLogin, onGoRegister }) {
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!email || !password) return setError('Please enter your email and password.')
    setLoading(true)
    const res = await authApi.login(email, password)
    setLoading(false)
    if (!res.success) return setError(res.error)
    localStorage.setItem('ignite_token', res.token)
    onLogin(res)
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!email) return setError('Please enter your email address.')
    setLoading(true)
    const res = await authApi.forgotPassword(email)
    setLoading(false)
    if (!res.success) return setError(res.error || 'Something went wrong.')
    setInfo('A 6-digit reset code has been sent. Check your email.')
    if (res._devCode) setInfo(`Reset code: ${res._devCode} (dev mode)`)
    setMode('reset')
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!code || !newPassword || !confirmPassword) return setError('All fields are required.')
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    const res = await authApi.resetPassword(email, code, newPassword)
    setLoading(false)
    if (!res.success) return setError(res.error)
    setInfo(res.message)
    setMode('login')
    setCode(''); setNewPassword(''); setConfirmPassword('')
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <span className="auth-logo-text">IGNITE</span>
        <span className="auth-logo-sub">STREAMING</span>
      </div>

      {mode === 'login' && (
        <>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue watching</p>
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" />
            </div>
            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-info">{info}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="auth-links">
            <button className="auth-link" onClick={() => { setMode('forgot'); setError(''); setInfo('') }}>
              Forgot password?
            </button>
            <span className="auth-separator">·</span>
            <button className="auth-link" onClick={onGoRegister}>Create account</button>
          </div>
        </>
      )}

      {mode === 'forgot' && (
        <>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your email to receive a reset code</p>
          <form onSubmit={handleForgot} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" />
            </div>
            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-info">{info}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Code'}
            </button>
          </form>
          <div className="auth-links">
            <button className="auth-link" onClick={() => { setMode('login'); setError(''); setInfo('') }}>
              ← Back to login
            </button>
          </div>
        </>
      )}

      {mode === 'reset' && (
        <>
          <h2 className="auth-title">Enter New Password</h2>
          {info && <p className="auth-info" style={{ marginBottom: 12 }}>{info}</p>}
          <form onSubmit={handleReset} className="auth-form">
            <div className="auth-field">
              <label>6-Digit Code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)}
                placeholder="123456" maxLength={6} />
            </div>
            <div className="auth-field">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters" />
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password" />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Resetting…' : 'Set New Password'}
            </button>
          </form>
          <div className="auth-links">
            <button className="auth-link" onClick={() => { setMode('login'); setError(''); setInfo('') }}>
              ← Back to login
            </button>
          </div>
        </>
      )}
    </div>
  )
}
