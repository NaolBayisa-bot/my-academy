import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PostsFeed from './PostsFeed'

function StudentDashboard() {
  const { user } = useAuth()

  // A student who hasn't picked a category yet must do so first.
  if (!user?.category_id) {
    return <Navigate to="/student/select-category" replace />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <PostsFeed />
    </div>
  )
}

export default StudentDashboard
