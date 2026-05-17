import { apiRequest } from './client'

export function getModalities(eventId) {
  const query = eventId ? `?event_id=${eventId}` : ''
  return apiRequest(`/modalities${query}`)
}

export function createModality(payload) {
  return apiRequest('/modalities', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteModality(modalityId) {
  return apiRequest(`/modalities/${modalityId}`, {
    method: 'DELETE',
  })
}
