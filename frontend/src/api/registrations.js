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

export function updateRegistrationStatus(registrationId, payload) {
  return apiRequest(`/registrations/${registrationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getEventRegistrations(eventId) {
  return apiRequest(`/registrations/by-event/${eventId}`)
}
