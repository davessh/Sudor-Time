import { apiRequest } from './client'

export function loginAdmin(payload) {
  return apiRequest('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
