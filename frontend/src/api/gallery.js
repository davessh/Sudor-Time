import { apiRequest } from './client'

export function getGalleryAlbums() {
  return apiRequest('/gallery')
}

export function getAdminGalleryAlbums() {
  return apiRequest('/gallery/admin')
}

export function createGalleryAlbum(payload) {
  return apiRequest('/gallery', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateGalleryAlbum(id, payload) {
  return apiRequest(`/gallery/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteGalleryAlbum(id) {
  return apiRequest(`/gallery/${id}`, {
    method: 'DELETE',
  })
}

export function uploadGalleryCover(id, file) {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(`/gallery/${id}/upload-cover`, {
    method: 'POST',
    body: formData,
  })
}
