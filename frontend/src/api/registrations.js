import { apiRequest } from './client'

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

export function updatePublicRegistration(registrationId, payload) {
  return apiRequest(`/registrations/public/${registrationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function searchPublicRegistrations(query, eventId = '') {
  const params = new URLSearchParams({ q: query })
  if (eventId) params.set('event_id', eventId)
  return apiRequest(`/registrations/public/search?${params.toString()}`)
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

export function expirePendingRegistrations(eventId) {
  const query = eventId ? `?event_id=${eventId}` : ''
  return apiRequest(`/registrations/expire-pending${query}`, {
    method: 'POST',
  })
}
