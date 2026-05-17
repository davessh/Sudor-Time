import { apiRequest } from './client'

export function getProducts(eventId) {
  const query = eventId ? `?event_id=${eventId}` : ''
  return apiRequest(`/products${query}`)
}

export function createProduct(payload) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteProduct(productId) {
  return apiRequest(`/products/${productId}`, {
    method: 'DELETE',
  })
}
