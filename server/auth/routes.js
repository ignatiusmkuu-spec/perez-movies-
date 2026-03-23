import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import {
  findUserByEmail, findUserById, createUser, updateUser,
  setSubscription, isSubscriptionActive, getDaysRemaining,
  setResetToken, findUserByResetToken
} from './db.js'

const router = Router()
const JWT_SECRET = process.env.AUTH_SECRET || 'ignite-auth-secret-change-in-prod'
const MPESA_STK_URL = 'https://mpesapi.giftedtech.co.ke/api/payNexusTech.php'
const MPESA_VERIFY_URL = 'https://mpesapi.giftedtech.co.ke/api/verify-transaction.php'

const PLANS = {
  '1month':  { label: '1 Month',  days: 30,  amount: 500  },
  '2months': { label: '2 Months', days: 60,  amount: 900  },
  '5months': { label: '5 Months', days: 150, amount: 3500 },
  '1year':   { label: '1 Year',   days: 365, amount: 7000 },
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Unauthorized' })
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

/* ── Register ── */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ success: false, error: 'Name, email and password are required.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' })
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' })
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = createUser({ name: name.trim(), email, passwordHash })
  const token = signToken(user)
  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, subscription: user.subscription }
  })
})

/* ── Login ── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' })
  }
  const user = findUserByEmail(email)
  if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password.' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ success: false, error: 'Invalid email or password.' })
  const token = signToken(user)
  const active = isSubscriptionActive(user)
  const daysLeft = getDaysRemaining(user)
  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, subscription: user.subscription },
    subscriptionActive: active,
    daysRemaining: daysLeft,
  })
})

/* ── Me / Status ── */
router.get('/me', authMiddleware, (req, res) => {
  const user = findUserById(req.userId)
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' })
  const active = isSubscriptionActive(user)
  const daysLeft = getDaysRemaining(user)
  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, subscription: user.subscription },
    subscriptionActive: active,
    daysRemaining: daysLeft,
  })
})

/* ── Plans list ── */
router.get('/plans', (req, res) => {
  res.json({ success: true, plans: PLANS })
})

/* ── Forgot password – request reset ── */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {}
  const user = findUserByEmail(email)
  if (!user) {
    // Don't reveal whether email exists
    return res.json({ success: true, message: 'If that email exists, a reset code has been sent.' })
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  setResetToken(user.id, code, expiry)
  // In production, send via email. For now, return in response (dev mode).
  res.json({ success: true, message: 'Reset code sent.', _devCode: code })
})

/* ── Forgot password – verify code & set new password ── */
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body || {}
  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, error: 'Email, code and new password are required.' })
  }
  const user = findUserByEmail(email)
  if (!user || user.resetToken !== code || !user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
    return res.status(400).json({ success: false, error: 'Invalid or expired reset code.' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' })
  }
  const passwordHash = await bcrypt.hash(newPassword, 10)
  updateUser(user.id, { passwordHash, resetToken: null, resetTokenExpiry: null })
  res.json({ success: true, message: 'Password reset successfully. You can now log in.' })
})

/* ── Initiate M-Pesa payment ── */
router.post('/pay/initiate', authMiddleware, async (req, res) => {
  const { plan, phoneNumber } = req.body || {}
  if (!PLANS[plan]) return res.status(400).json({ success: false, error: 'Invalid plan.' })
  if (!phoneNumber) return res.status(400).json({ success: false, error: 'Phone number is required.' })

  const cleaned = phoneNumber.replace(/\s+/g, '').replace(/^\+/, '')
  if (!/^(2547|2541)\d{8}$/.test(cleaned)) {
    return res.status(400).json({ success: false, error: 'Phone must start with 2547 or 2541 (e.g. 254712345678).' })
  }

  const amount = PLANS[plan].amount

  try {
    const mpesaRes = await fetch(MPESA_STK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phoneNumber: cleaned, amount }),
    })
    const data = await mpesaRes.json()
    if (!data.success) {
      return res.status(502).json({ success: false, error: data.message || 'M-Pesa request failed.' })
    }
    res.json({
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      message: data.message,
      plan,
      amount,
    })
  } catch (err) {
    res.status(502).json({ success: false, error: 'Could not connect to payment gateway.' })
  }
})

/* ── Poll transaction status ── */
router.post('/pay/verify', authMiddleware, async (req, res) => {
  const { checkoutRequestId, plan } = req.body || {}
  if (!checkoutRequestId) return res.status(400).json({ success: false, error: 'checkoutRequestId required.' })

  try {
    const verifyRes = await fetch(MPESA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutRequestId }),
    })
    const data = await verifyRes.json()

    if (data.success && data.status === 'completed') {
      const user = setSubscription(req.userId, plan)
      const daysLeft = getDaysRemaining(user)
      return res.json({
        success: true,
        status: 'completed',
        receipt: data.data?.MpesaReceiptNumber,
        daysRemaining: daysLeft,
        subscription: user.subscription,
      })
    }

    res.json({ success: false, status: data.status, data: data.data })
  } catch {
    res.status(502).json({ success: false, error: 'Could not verify payment.' })
  }
})

export default router
export { authMiddleware }
