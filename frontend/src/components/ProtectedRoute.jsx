import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return children
}
