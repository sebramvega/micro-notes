const TOKEN_KEY = 'mn_token'

export function setToken(t) { localStorage.setItem(TOKEN_KEY, t) }
export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }

async function request(base, path, opts = {}) {
  const headers = opts.headers ? { ...opts.headers } : {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${base}${path}`, { ...opts, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || res.statusText || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const UsersAPI = {
  signup: (email, password) => request('/api/users', '/auth/signup', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  login: (email, password) => request('/api/users', '/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  me: () => request('/api/users', '/auth/me', { method: 'GET' }),
}

export const NotesAPI = {
  list: () => request('/api/notes', '/notes', { method: 'GET' }),
  create: (title, body) => request('/api/notes', '/notes', {
    method: 'POST', body: JSON.stringify({ title, body })
  }),
  update: (id, data) => request('/api/notes', `/notes/${id}`, {
    method: 'PUT', body: JSON.stringify(data)
  }),
  remove: (id) => request('/api/notes', `/notes/${id}`, { method: 'DELETE' }),
}
