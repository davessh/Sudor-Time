import { apiRequest } from './client'

export function createMercadoPagoPreference(registrationId) {
  return apiRequest('/payments/mercadopago/create-preference', {
    method: 'POST',
    body: JSON.stringify({ registration_id: Number(registrationId) }),
  })
}

export function getRegistrationPaymentStatus(registrationId) {
  return apiRequest(`/payments/registrations/${registrationId}/status`)
}
