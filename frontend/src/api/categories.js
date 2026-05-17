import { apiRequest } from './client'

export function getCategories(eventId) {
  const query = eventId ? `?event_id=${eventId}` : ''
  return apiRequest(`/categories${query}`)
}

export function createCategory(payload) {
  return apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteCategory(categoryId) {
  return apiRequest(`/categories/${categoryId}`, {
    method: 'DELETE',
  })
}
