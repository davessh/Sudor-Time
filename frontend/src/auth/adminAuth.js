const ADMIN_TOKEN_KEY = 'sudortime_admin_token'

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken())
}
