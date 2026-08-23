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
            ; (categoriesRes.data.categories || []).forEach((category) => {
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
    return <div>Loading...</div>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Community</p>
          <h1 className="page-title">Posts</h1>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="section-shell empty-state">
          <p>No posts yet.</p>
        </div>
      ) : (
        <div className="card-grid single-column-grid">
          {posts.map((post) => (
            <article key={post.id} className="list-card post-card">
              <div className="card-top">
                <div className="info-block">
                  <p className="eyebrow">{categoryLabel(post)}</p>
                  <h3>{post.title}</h3>
                </div>
                <span className="chip neutral">New</span>
              </div>

              <p className="post-body">{post.content}</p>

              <div className="meta-row">
                <span>{post.author?.name || 'Unknown author'}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default PostsFeed
