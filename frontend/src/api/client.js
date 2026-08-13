const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive the session cookie
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  register: (email, name, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Deterministic match data
  getMatches: () => request('/matches'),
  getScorecard: (matchId) => request(`/match/${matchId}/scorecard`),

  // Probabilistic simulation persistence
  saveSimulation: (payload) => request('/simulations', { method: 'POST', body: JSON.stringify(payload) }),
  listSimulations: () => request('/simulations'),
  getSimulation: (id) => request(`/simulations/${id}`),
  deleteSimulation: (id) => request(`/simulations/${id}`, { method: 'DELETE' }),
}
