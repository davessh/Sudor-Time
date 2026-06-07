import { apiRequest } from './client'

export function getSiteSettings() {
  return apiRequest('/site-settings')
}

export function updateSiteSettings(payload) {
  return apiRequest('/site-settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function uploadHeroBackground(file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest('/site-settings/upload-hero-background', {
    method: 'POST',
    body: formData,
  })
}
