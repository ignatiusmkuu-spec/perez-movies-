import { useState, useEffect } from 'react'
import { useAuth } from './auth/authContext'
import { authApi } from '../api/auth'
import './DeveloperPage.css'

function AdminPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ name: '', email: '', password: '', days: '' })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editDays, setEditDays] = useState('')
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError('')
    const res = await authApi.adminListUsers()
    if (res.success) setUsers(res.users)
    else setError(res.error || 'Failed to load users.')
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setCreating(true)
    const res = await authApi.adminCreateUser(form.name, form.email, form.password, form.days)
    if (res.success) {
      setFormSuccess(`✅ Account created for ${res.user.name} (${res.user.daysRemaining} days access)`)
      setForm({ name: '', email: '', password: '', days: '' })
      loadUsers()
    } else {
      setFormError(res.error || 'Failed to create user.')
    }
    setCreating(false)
  }

  async function handleSetDays(userId) {
    setEditError('')
    setEditSuccess('')
    const res = await authApi.adminSetDays(userId, editDays)
    if (res.success) {
      setEditSuccess(`✅ ${res.user.name} updated to ${res.user.daysRemaining} days`)
      setEditingId(null)
      setEditDays('')
      loadUsers()
    } else {
      setEditError(res.error || 'Failed to update.')
    }
  }

  function daysColor(active, days) {
    if (!active) return '#ef4444'
    if (days <= 7) return '#f97316'
    return '#22c55e'
  }

  return (
    <div className="admin-panel">
      <h2 className="admin-title">Admin Panel</h2>

      {/* Create User Form */}
      <div className="admin-card">
        <h3 className="admin-card-title">Create New Login</h3>
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="admin-form-row">
            <input
              className="admin-input"
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="admin-input"
              placeholder="Email Address"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="admin-form-row">
            <input
              className="admin-input"
              placeholder="Password (min 4 chars)"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <input
              className="admin-input"
              placeholder="Access Days (e.g. 30)"
              type="number"
              min="1"
              value={form.days}
              onChange={e => setForm(f => ({ ...f, days: e.target.value }))}
              required
            />
          </div>
          {formError && <div className="admin-msg admin-msg-err">{formError}</div>}
          {formSuccess && <div className="admin-msg admin-msg-ok">{formSuccess}</div>}
          <button className="admin-btn" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">All Users ({users.length})</h3>
          <button className="admin-refresh-btn" onClick={loadUsers} disabled={loading}>↻ Refresh</button>
        </div>
        {editError && <div className="admin-msg admin-msg-err">{editError}</div>}
        {editSuccess && <div className="admin-msg admin-msg-ok">{editSuccess}</div>}
        {loading ? (
          <div className="admin-loading">Loading users…</div>
        ) : error ? (
          <div className="admin-msg admin-msg-err">{error}</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">No users yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Days Left</th>
                  <th>Update Days</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className="admin-email">{u.email}</td>
                    <td>
                      <span
                        className="admin-badge"
                        style={{ background: daysColor(u.active, u.daysRemaining) }}
                      >
                        {u.active ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td style={{ color: daysColor(u.active, u.daysRemaining), fontWeight: 700 }}>
                      {u.active ? `${u.daysRemaining}d` : '—'}
                    </td>
                    <td>
                      {editingId === u.id ? (
                        <div className="admin-edit-row">
                          <input
                            className="admin-input admin-input-sm"
                            type="number"
                            min="1"
                            placeholder="Days"
                            value={editDays}
                            onChange={e => setEditDays(e.target.value)}
                          />
                          <button className="admin-btn admin-btn-sm" onClick={() => handleSetDays(u.id)}>Save</button>
                          <button className="admin-btn admin-btn-sm admin-btn-cancel" onClick={() => { setEditingId(null); setEditDays('') }}>✕</button>
                        </div>
                      ) : (
                        <button className="admin-btn admin-btn-sm" onClick={() => { setEditingId(u.id); setEditDays('') }}>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DeveloperPage() {
  const { user } = useAuth()
  const isDeveloper = user?.role === 'developer'

  return (
    <div className="dev-page">
      <div className="dev-card">
        <div className="dev-avatar">👨‍💻</div>
        <div className="dev-name">Ignatius</div>
        <div className="dev-title">Full Stack Developer</div>

        <div className="dev-app-name">
          <div className="dev-app-label">Application</div>
          <div className="dev-app-title">
            <span className="red">IGNATIUS</span> STREAMING SITE
          </div>
        </div>

        <div className="dev-divider" />

        <p className="dev-about">
          A premium movie streaming platform featuring the latest movies, drama series,
          anime, and live sports streams. Built with passion for entertainment.
        </p>

        <div className="dev-contacts">
          <a
            className="dev-contact-link"
            href="https://wa.me/254706535581"
            target="_blank"
            rel="noreferrer"
          >
            <span className="contact-icon">💬</span>
            <div className="contact-info">
              <div className="contact-type">WhatsApp</div>
              <div className="contact-value">+254 706 535 581</div>
            </div>
          </a>

          <a
            className="dev-contact-link"
            href="tel:+254706535581"
          >
            <span className="contact-icon">📞</span>
            <div className="contact-info">
              <div className="contact-type">Phone / Call</div>
              <div className="contact-value">+254 706 535 581</div>
            </div>
          </a>

          <a
            className="dev-contact-link"
            href="sms:+254706535581"
          >
            <span className="contact-icon">✉️</span>
            <div className="contact-info">
              <div className="contact-type">SMS</div>
              <div className="contact-value">+254 706 535 581</div>
            </div>
          </a>
        </div>

        <a
          href="#video"
          className="dev-video-btn"
        >
          🎬 Watch My Story — Animated Film
        </a>

        <div className="dev-built">
          Made with ❤️ by <span>Ignatius</span> · 2025
        </div>
      </div>

      {isDeveloper && <AdminPanel />}
    </div>
  )
}
