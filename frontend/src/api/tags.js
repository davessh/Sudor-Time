import { apiRequest } from './client'

export function getTags() {
  return apiRequest('/tags')
}

export function createTag(payload) {
  return apiRequest('/tags', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}