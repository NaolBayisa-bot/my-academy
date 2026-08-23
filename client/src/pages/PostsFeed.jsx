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
    return <div>Loading...</div>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  return (
    <div>
      <h1>Posts</h1>

      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul style={listStyle}>
          {posts.map((post) => (
            <li key={post.id} style={itemStyle}>
              <h3 style={{ marginTop: '0' }}>{post.title}</h3>
              <p style={{ margin: '4px 0' }}>{post.content}</p>
              <p style={metaStyle}>
                <span style={{ fontWeight: 'bold' }}>
                  {post.author?.name || 'Unknown author'}
                </span>{' '}
                — {categoryLabel(post)} ·{' '}
                <span>{formatDate(post.created_at)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
}

const itemStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '12px',
  marginBottom: '12px',
}

const metaStyle = {
  fontSize: '12px',
  color: '#666',
  margin: '0',
}

export default PostsFeed
