import { Navigate, useLocation } from 'react-router-dom'
import { ADMIN_ENTRY_PATH, isAdminAuthenticated } from '../../auth/adminAuth'

export default function RequireAdmin({ children }) {
  const location = useLocation()

  if (!isAdminAuthenticated()) {
    return <Navigate to={ADMIN_ENTRY_PATH} replace state={{ from: location.pathname }} />
  }

  return children
}
