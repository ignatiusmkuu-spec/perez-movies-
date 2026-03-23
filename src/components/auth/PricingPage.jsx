import { useState, useEffect, useRef } from 'react'
import { authApi } from '../../api/auth'
import './Auth.css'

const PLANS = [
  { key: '1month',  label: '1 Month',  days: 30,  amount: 500,  badge: null },
  { key: '2months', label: '2 Months', days: 60,  amount: 900,  badge: 'Popular' },
  { key: '5months', label: '5 Months', days: 150, amount: 3500, badge: 'Best Value' },
  { key: '1year',   label: '1 Year',   days: 365, amount: 7000, badge: 'Ultimate' },
]

function formatPhone(raw) {
  const clean = raw.replace(/\D/g, '')
  if (clean.startsWith('0')) return '254' + clean.slice(1)
  if (clean.startsWith('7') || clean.startsWith('1')) return '254' + clean
  return clean
}

export default function PricingPage({ user, onSubscribed }) {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState('plans') // 'plans' | 'payment' | 'polling' | 'success' | 'failed'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pollMsg, setPollMsg] = useState('Waiting for payment confirmation…')
  const [receipt, setReceipt] = useState('')
  const [daysLeft, setDaysLeft] = useState(0)
  const checkoutRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => () => clearInterval(pollRef.current), [])

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setStep('payment')
    setError('')
  }

  const handleInitiate = async (e) => {
    e.preventDefault()
    setError('')
    const formatted = formatPhone(phone)
    if (!/^(2547|2541)\d{8}$/.test(formatted)) {
      return setError('Enter a valid Safaricom number (07xx or 01xx or 2547xx / 2541xx).')
    }
    setLoading(true)
    const res = await authApi.initiatePayment(selectedPlan.key, formatted)
    setLoading(false)
    if (!res.success) return setError(res.error)
    checkoutRef.current = res.checkoutRequestId
    setStep('polling')
    setPollMsg('STK push sent! Check your phone and enter your M-Pesa PIN…')
    startPolling(res.checkoutRequestId)
  }

  const startPolling = (checkoutId) => {
    let attempts = 0
    const maxAttempts = 40
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        clearInterval(pollRef.current)
        setStep('failed')
        setError('Payment timed out. Please try again.')
        return
      }
      const res = await authApi.verifyPayment(checkoutId, selectedPlan.key)
      if (res.success && res.status === 'completed') {
        clearInterval(pollRef.current)
        setReceipt(res.receipt || '')
        setDaysLeft(res.daysRemaining || selectedPlan.days)
        setStep('success')
        setTimeout(() => onSubscribed(res), 1800)
        return
      }
      if (res.status === 'cancelled') {
        clearInterval(pollRef.current)
        setStep('failed')
        setError('Payment was cancelled. Please try again.')
        return
      }
      if (res.status === 'failed_insufficient_funds') {
        clearInterval(pollRef.current)
        setStep('failed')
        setError('Insufficient M-Pesa balance. Top up and try again.')
        return
      }
      if (res.status === 'timeout') {
        clearInterval(pollRef.current)
        setStep('failed')
        setError('Could not reach your phone. Check your number and try again.')
        return
      }
      if (!['pending'].includes(res.status) && !res.success) {
        clearInterval(pollRef.current)
        setStep('failed')
        setError(res.data?.ResultDesc || 'Payment failed. Please try again.')
      }
    }, 3000)
  }

  const reset = () => {
    clearInterval(pollRef.current)
    setStep('plans')
    setSelectedPlan(null)
    setPhone('')
    setError('')
    checkoutRef.current = null
  }

  return (
    <div className="pricing-wrapper">
      <div className="auth-logo" style={{ marginBottom: 4 }}>
        <span className="auth-logo-text">IGNITE</span>
        <span className="auth-logo-sub">STREAMING</span>
      </div>
      <h2 className="auth-title">Choose Your Plan</h2>
      <p className="auth-subtitle">
        Welcome, <strong>{user?.name}</strong>! Pick a subscription to start streaming.
      </p>

      {step === 'plans' && (
        <div className="plans-grid">
          {PLANS.map(plan => (
            <button key={plan.key} className={`plan-card${selectedPlan?.key === plan.key ? ' selected' : ''}`}
              onClick={() => handleSelectPlan(plan)}>
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <div className="plan-label">{plan.label}</div>
              <div className="plan-days">{plan.days} days</div>
              <div className="plan-price">
                <span className="plan-currency">KES</span>
                <span className="plan-amount">{plan.amount.toLocaleString()}</span>
              </div>
              <div className="plan-per-day">
                ≈ KES {(plan.amount / plan.days).toFixed(0)}/day
              </div>
              <div className="plan-cta">Select →</div>
            </button>
          ))}
        </div>
      )}

      {step === 'payment' && selectedPlan && (
        <div className="payment-panel">
          <div className="payment-summary">
            <span className="payment-plan-name">{selectedPlan.label}</span>
            <span className="payment-plan-price">KES {selectedPlan.amount.toLocaleString()}</span>
            <span className="payment-plan-days">{selectedPlan.days} days access</span>
          </div>
          <form onSubmit={handleInitiate} className="auth-form">
            <div className="auth-field">
              <label>M-Pesa Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="07xx xxx xxx or 2547xx xxx xxx" />
              <span className="auth-hint">Safaricom numbers only (07xx / 01xx)</span>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn mpesa-btn" disabled={loading}>
              {loading ? 'Sending STK push…' : `Pay KES ${selectedPlan.amount.toLocaleString()} via M-Pesa`}
            </button>
          </form>
          <button className="auth-link" style={{ marginTop: 12 }} onClick={reset}>← Change plan</button>
        </div>
      )}

      {step === 'polling' && (
        <div className="poll-panel">
          <div className="poll-spinner" />
          <p className="poll-msg">{pollMsg}</p>
          <p className="poll-sub">Checking every 3 seconds… Do not close this page.</p>
          <button className="auth-link" style={{ marginTop: 20 }} onClick={reset}>Cancel</button>
        </div>
      )}

      {step === 'success' && (
        <div className="success-panel">
          <div className="success-icon">✓</div>
          <h3 className="success-title">Payment Confirmed!</h3>
          {receipt && <p className="success-receipt">M-Pesa Receipt: <strong>{receipt}</strong></p>}
          <p className="success-days">You have <strong>{daysLeft} days</strong> of streaming access.</p>
          <p className="success-sub">Redirecting you to the site…</p>
        </div>
      )}

      {step === 'failed' && (
        <div className="failed-panel">
          <div className="failed-icon">✕</div>
          <h3 className="failed-title">Payment Failed</h3>
          <p className="auth-error">{error}</p>
          <button className="auth-btn" style={{ marginTop: 20 }} onClick={() => setStep('payment')}>
            Try Again
          </button>
          <button className="auth-link" style={{ marginTop: 10 }} onClick={reset}>Change Plan</button>
        </div>
      )}
    </div>
  )
}
