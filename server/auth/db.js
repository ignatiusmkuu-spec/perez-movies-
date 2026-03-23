import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = join(__dir, '..', 'data')
const USERS_FILE = join(DATA_DIR, 'users.json')

const DEFAULTS = { users: [] }

function ensure() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    if (!existsSync(USERS_FILE)) writeFileSync(USERS_FILE, JSON.stringify(DEFAULTS, null, 2))
  } catch { /* read-only fs */ }
}

function read() {
  ensure()
  try { return JSON.parse(readFileSync(USERS_FILE, 'utf8')) }
  catch { return { ...DEFAULTS } }
}

function write(data) {
  ensure()
  writeFileSync(USERS_FILE, JSON.stringify(data, null, 2))
}

export function findUserByEmail(email) {
  const db = read()
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

export function findUserById(id) {
  const db = read()
  return db.users.find(u => u.id === id) || null
}

export function createUser({ name, email, passwordHash }) {
  const db = read()
  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    subscription: null,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  write(db)
  return user
}

export function updateUser(id, fields) {
  const db = read()
  const idx = db.users.findIndex(u => u.id === id)
  if (idx === -1) return null
  db.users[idx] = { ...db.users[idx], ...fields }
  write(db)
  return db.users[idx]
}

export function setSubscription(userId, plan) {
  const now = new Date()
  const daysMap = { '1month': 30, '2months': 60, '5months': 150, '1year': 365 }
  const days = daysMap[plan] || 30
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
  return updateUser(userId, {
    subscription: { plan, startedAt: now.toISOString(), expiresAt, days }
  })
}

export function isSubscriptionActive(user) {
  if (!user?.subscription?.expiresAt) return false
  return new Date(user.subscription.expiresAt) > new Date()
}

export function getDaysRemaining(user) {
  if (!user?.subscription?.expiresAt) return 0
  const diff = new Date(user.subscription.expiresAt) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function setResetToken(userId, token, expiry) {
  return updateUser(userId, { resetToken: token, resetTokenExpiry: expiry })
}

export function findUserByResetToken(token) {
  const db = read()
  return db.users.find(u => u.resetToken === token && u.resetTokenExpiry && new Date(u.resetTokenExpiry) > new Date()) || null
}
