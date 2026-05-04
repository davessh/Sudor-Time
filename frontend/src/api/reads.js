import { apiRequest } from './client'

export function getReads() {
  return apiRequest('/reads')
}

export function getReadDetail(readId) {
  return apiRequest(`/reads/${readId}/detail`)
}