import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PostsFeed from './PostsFeed'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

function StudentDashboard() {
  const { user } = useAuth()

  if (!user?.category_id) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative z-10 w-full max-w-2xl">
          <Card padding="p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-on-surface mb-2 font-headline-lg">
                Welcome back, {user?.name || 'Student'}.
              </h1>
              <p className="text-on-surface-variant">Let's customize your learning experience</p>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-outline-variant/30 mb-6">
              <h2 className="text-xl font-semibold text-on-surface mb-4">Customize Your Feed</h2>
              <p className="text-on-surface-variant mb-4">
                Select a category to see posts relevant to your interests.
              </p>
              <div className="text-center">
                <Link to="/student/select-category" className="inline-block">
                  <Button variant="primary" fullWidth>
                    Select Category
                  </Button>
                </Link>
              </div>
            </div>

            <div className="text-center">
              <p className="text-on-surface-variant mb-4">Or continue browsing all posts:</p>
              <Button variant="secondary" onClick={() => {}}>
                Browse All Posts
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative z-10">
        <PostsFeed />
      </div>
    </div>
  )
}

export default StudentDashboard
