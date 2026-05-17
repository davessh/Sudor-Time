import { apiRequest } from './client'

export function getShirtSizes(eventId, soloActivas = false) {
  const params = new URLSearchParams()
  if (eventId) params.set('event_id', eventId)
  params.set('solo_activas', String(soloActivas))
  const query = params.toString()
  return apiRequest(`/shirt-sizes${query ? `?${query}` : ''}`)
}

export function createShirtSize(payload) {
  return apiRequest('/shirt-sizes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateShirtSize(shirtSizeId, payload) {
  return apiRequest(`/shirt-sizes/${shirtSizeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteShirtSize(shirtSizeId) {
  return apiRequest(`/shirt-sizes/${shirtSizeId}`, {
    method: 'DELETE',
  })
}
