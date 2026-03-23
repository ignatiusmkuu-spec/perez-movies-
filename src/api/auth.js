const BASE = '/api/auth'

async function req(path, options = {}) {
  const token = localStorage.getItem('ignite_token')
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  return res.json()
}

export const authApi = {
  register: (name, email, password) =>
    req('/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    req('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => req('/me'),

  plans: () => req('/plans'),

  forgotPassword: (email) =>
    req('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (email, code, newPassword) =>
    req('/reset-password', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),

  initiatePayment: (plan, phoneNumber) =>
    req('/pay/initiate', { method: 'POST', body: JSON.stringify({ plan, phoneNumber }) }),

  verifyPayment: (checkoutRequestId, plan) =>
    req('/pay/verify', { method: 'POST', body: JSON.stringify({ checkoutRequestId, plan }) }),
}
