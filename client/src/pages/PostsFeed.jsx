import { useEffect, useState } from 'react'
import api from '../api/axios'

// Shared posts feed, visible to every logged-in user. Read-only: it only
// renders posts — students cannot create posts from here (POST /api/posts is
// restricted to super_admin / category_admin at the route level).
//
// Data flow:
//  - GET /api/posts      -> posts already filtered by the backend per the caller's
//                           role (student & category_admin see their own category
//                           + global; super_admin sees all), ordered newest-first
//                           by created_at, each with its eager-loaded `author`
//                           ({ id, name, email }).
//  - GET /api/categories -> public list of all categories (id + name) so a post's
//                           category can be labeled; a null category_id means
//                           "Global".
function PostsFeed() {
  const [posts, setPosts] = useState([])
  const [categoryNames, setCategoryNames] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const loadFeed = async () => {
      try {
        const [postsRes, categoriesRes] = await Promise.all([
          api.get('/posts'),
          api.get('/categories'),
        ])
        if (!cancelled) {
          setPosts(postsRes.data.posts || [])
          const names = {}
          ;(categoriesRes.data.categories || []).forEach((category) => {
            names[category.id] = category.name
          })
          setCategoryNames(names)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error || 'Failed to load posts. Please try again.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadFeed()
    return () => {
      cancelled = true
    }
  }, [])

  const categoryLabel = (post) => {
    if (!post.category_id) return 'Global'
    return categoryNames[post.category_id] || 'Uncategorized'
  }

  const formatDate = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-violet-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Posts</h1>

      {posts.length === 0 ? (
        <p className="text-slate-400">No posts yet.</p>
      ) : (
        <ul className="list-none space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="bg-glass border border-glass-border rounded-xl p-4 shadow-glass">
              <h3 className="text-xl font-semibold text-slate-100 mb-2">{post.title}</h3>
              <p className="text-slate-300 mb-3">{post.content}</p>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <span className="font-medium text-violet-400">
                  {post.author?.name || 'Unknown author'}
                </span>
                <span>—</span>
                <span>{categoryLabel(post)}</span>
                <span>·</span>
                <span>{formatDate(post.created_at)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default PostsFeed
