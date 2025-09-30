/*
Micro Notes — Frontend API Client
---------------------------------

Thin wrapper around `fetch` that handles:
- Bearer token injection from `localStorage`
- JSON request/response plumbing (including 204 No Content)
- Normalized error throwing with server text when available

Key behaviors & notes
- Tokens are stored under `mn_token` in `localStorage`. Only the access token is kept.
- If a request includes a body and no explicit Content-Type, we default to `application/json`.
- Non-2xx responses throw an Error whose message prefers server text body > statusText > "HTTP <code>".
- `204 No Content` returns `null` to make delete/update flows explicit.
- Base URLs are fixed to service reverse proxies:
    Users  → `/api/users`
    Notes  → `/api/notes`
  The backend must map these to the correct microservices.

Typical usage
-------------
    import { UsersAPI, NotesAPI, setToken, clearToken } from "./api";
    const { access_token } = await UsersAPI.login(email, password);
    setToken(access_token);
    const notes = await NotesAPI.list();
*/

const TOKEN_KEY = 'mn_token' // why: single place to change storage key if needed

export function setToken(t) { localStorage.setItem(TOKEN_KEY, t) }       // why: persists across reloads
export function getToken() { return localStorage.getItem(TOKEN_KEY) }    // why: read lazily at request-time
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }      // why: logout = remove token only

async function request(base, path, opts = {}) {
  // why: clone/extend headers so callers can override or add fields safely
  const headers = opts.headers ? { ...opts.headers } : {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}` // why: server expects standard Bearer tokens
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json' // why: default JSON

  // why: compose absolute path at the edge; keeps call sites compact and consistent
  const res = await fetch(`${base}${path}`, { ...opts, headers })

  // why: bubble meaningful server error text up to UI for better DX/UX
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || res.statusText || `HTTP ${res.status}`)
  }

  // why: DELETE routes often return 204; caller should not expect a body
  if (res.status === 204) return null

  // why: successful responses are JSON by contract across services
  return res.json()
}

export const UsersAPI = {
  // why: signup/login endpoints live behind the Users gateway base
  signup: (email, password) => request('/api/users', '/auth/signup', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  login: (email, password) => request('/api/users', '/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  me: () => request('/api/users', '/auth/me', { method: 'GET' }),
}

export const NotesAPI = {
  // why: notes CRUD is scoped to the authenticated user on the Notes service
  list: () => request('/api/notes', '/notes', { method: 'GET' }),
  create: (title, body) => request('/api/notes', '/notes', {
    method: 'POST', body: JSON.stringify({ title, body })
  }),
  update: (id, data) => request('/api/notes', `/notes/${id}`, {
    method: 'PUT', body: JSON.stringify(data)
  }),
  remove: (id) => request('/api/notes', `/notes/${id}`, { method: 'DELETE' }),
}
