import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  // Wait for the async session restore to finish before deciding, so we never
  // bounce a real user to /login during app startup.
  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return children
}

export default ProtectedRoute
