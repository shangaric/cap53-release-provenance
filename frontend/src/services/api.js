const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to reach the API. Check that the backend is running on port 5000.')
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    try {
      const body = await response.json()
      message = body.message || message
      if (body.validationErrors) {
        const details = Object.values(body.validationErrors).join(' ')
        if (details) message = `${message} ${details}`
      }
    } catch {
      // The server may return a non-JSON error body.
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export const api = {
  dashboard: () => request('/dashboard/stats'),
  releases: (query = '') => request(`/releases${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  release: (id) => request(`/releases/${id}`),
  createRelease: (body) => request('/releases', json('POST', body)),
  deleteRelease: (id) => request(`/releases/${id}`, { method: 'DELETE' }),
  deployments: () => request('/deployments'),
  releaseDeployments: (id) => request(`/releases/${id}/deployments`),
  createDeployment: (body) => request('/deployments', json('POST', body)),
  approvals: (releaseId) => request(`/approvals${releaseId ? `?releaseId=${releaseId}` : ''}`),
  createApproval: (body) => request('/approvals', json('POST', body)),
  decideApproval: (id, body) => request(`/approvals/${id}/decision`, json('PATCH', body)),
  testEvidence: (releaseId) => request(`/test-evidence${releaseId ? `?releaseId=${releaseId}` : ''}`),
  createTestEvidence: (body) => request('/test-evidence', json('POST', body)),
}

export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatShortDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}
