import { apiRequest } from './client'

export function createRegistration(payload) {
  return apiRequest('/registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRegistration(registrationId, payload) {
  return apiRequest(`/registrations/${registrationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getEventRegistrations(eventId) {
  return apiRequest(`/events/${eventId}/registrations`)
}