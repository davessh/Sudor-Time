import { apiRequest } from './client'

export function getEvents() {
  return apiRequest('/events')
}

export function getEventById(eventId) {
  return apiRequest(`/events/${eventId}`)
}

export function getEventSetup(eventId) {
  return apiRequest(`/events/${eventId}/setup`)
}

export function getEventStats(eventId) {
  return apiRequest(`/events/${eventId}/stats`)
}

export function createEvent(payload) {
  return apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEvent(eventId, payload) {
  return apiRequest(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteEvent(eventId) {
  return apiRequest(`/events/${eventId}`, {
    method: 'DELETE',
  })
}

export function uploadEventConvocatoria(eventId, file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(`/events/${eventId}/upload-convocatoria`, {
    method: 'POST',
    body: formData,
  })
}

export function uploadEventPortada(eventId, file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(`/events/${eventId}/upload-portada`, {
    method: 'POST',
    body: formData,
  })
}

export function uploadEventPlayera(eventId, file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(`/events/${eventId}/upload-playera`, {
    method: 'POST',
    body: formData,
  })
}

export function uploadEventMedalla(eventId, file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(`/events/${eventId}/upload-medalla`, {
    method: 'POST',
    body: formData,
  })
}

export function uploadEventDorsal(eventId, file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(`/events/${eventId}/upload-dorsal`, {
    method: 'POST',
    body: formData,
  })
}

export function createEventKitItem(eventId, payload) {
  return apiRequest(`/events/${eventId}/kit-items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEventKitItem(eventId, itemId, payload) {
  return apiRequest(`/events/${eventId}/kit-items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteEventKitItem(eventId, itemId) {
  return apiRequest(`/events/${eventId}/kit-items/${itemId}`, {
    method: 'DELETE',
  })
}

export function uploadEventKitItemImage(eventId, itemId, file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(`/events/${eventId}/kit-items/${itemId}/upload-image`, {
    method: 'POST',
    body: formData,
  })
}
