import { apiRequest } from './client'

export function createMercadoPagoPreference(accessToken) {
  return apiRequest('/payments/mercadopago/create-preference', {
    method: 'POST',
    body: JSON.stringify({ access_token: accessToken }),
  })
}

export function getRegistrationPaymentStatus(accessToken) {
  return apiRequest(`/payments/registrations/access/${accessToken}/status`)
}
