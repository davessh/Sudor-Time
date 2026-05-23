import { getAdminToken } from '../auth/adminAuth'
import { API_BASE_URL, apiRequest } from './client'

export function createRegistration(payload) {
  return apiRequest('/registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createPublicRegistration(payload) {
  return apiRequest('/registrations/public', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePublicRegistration(accessToken, payload) {
  return apiRequest(`/registrations/public/${accessToken}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updateRegistration(registrationId, payload) {
  return apiRequest(`/registrations/${registrationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updateRegistrationStatus(registrationId, payload) {
  return apiRequest(`/registrations/${registrationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getEventRegistrations(eventId) {
  return apiRequest(`/registrations/by-event/${eventId}`)
}

export async function downloadEventRegistrationsCsv(eventId, filters = {}) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value)
    }
  })

  const query = params.toString()
  const response = await fetch(`${API_BASE_URL}/registrations/by-event/${eventId}/export.csv${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  })

  if (!response.ok) {
    let message = 'No se pudo exportar el CSV'
    try {
      const errorData = await response.json()
      message = errorData.detail || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/)

  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] || `inscritos-evento-${eventId}.csv`,
  }
}

export function expirePendingRegistrations(eventId) {
  const query = eventId ? `?event_id=${eventId}` : ''
  return apiRequest(`/registrations/expire-pending${query}`, {
    method: 'POST',
  })
}
