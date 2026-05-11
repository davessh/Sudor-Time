import { apiRequest } from './client'

export function createParticipant(payload) {
  return apiRequest('/participants', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getParticipants() {
  return apiRequest('/participants')
}
