import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function StudentDashboard() {
  const { user } = useAuth()

  // A student who hasn't picked a category yet must do so first.
  if (!user?.category_id) {
    return <Navigate to="/student/select-category" replace />
  }

  return (
    <div>
      <h1>Student Dashboard</h1>
    </div>
  )
}

export default StudentDashboard
