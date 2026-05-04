import { apiRequest } from './client'

export function getEvents() {
  return apiRequest('/events')
}

export function getEventById(eventId) {
  return apiRequest(`/events/${eventId}`)
}

export function createEvent(payload) {
  return apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}