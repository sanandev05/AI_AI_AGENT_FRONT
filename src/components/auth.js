// Lightweight auth helper used by client components.
// Assumption: authentication presence is detected by a token in localStorage 'auth_token'
// or a cookie named 'auth_token'. Adjust to your backend/session system as needed.
export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  try {
    const token = localStorage.getItem('auth_token')
    if (token) return true
    // fallback: check cookies
    const m = document.cookie.match(/(^|;)\s*auth_token=([^;]+)/)
    return !!(m && m[2])
  } catch {
    return false
  }
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('auth_token', token) } catch {}
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem('auth_token') } catch {}
}
