import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

// Posts page shared by `category_admin` and `super_admin`.
//
//  - category_admin creates posts scoped to their own category — the
//    `category_id` is attached automatically from the authenticated user.
//  - super_admin additionally gets a posting-scope toggle: "Post to my
//    category" (category_id = their category) or "Post globally to all
//    users" (category_id = null). A super_admin sees all posts.
//
// GET /api/posts is scoped by the server per role (a category_admin sees
// their category + global posts; a super_admin sees everything) and is
// already ordered by `created_at` descending (newest first).
function Posts() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  // Posts list
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // New-post form
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // super_admin-only posting-scope toggle (defaults to the admin's category).
  const [postToMyCategory, setPostToMyCategory] = useState(true)

  // Per-post delete in-flight state.
  const [deletingId, setDeletingId] = useState(null)

  const clearError = () => setError(null)

  // Re-fetches the visible posts. Used after create/delete and (via a
  // cancellable copy below) on mount.
  const loadPosts = async () => {
    const res = await api.get('/posts')
    setPosts(res.data.posts)
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/posts')
        if (!cancelled) setPosts(res.data.posts)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load posts.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      // `category_id` depends on role + (super_admin) the toggle.
      const categoryId = isSuperAdmin
        ? (postToMyCategory ? user?.category_id : null)
        : user?.category_id

      await api.post('/posts', {
        title,
        content,
        category_id: categoryId,
      })

      setTitle('')
      setContent('')
      await loadPosts()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId) => {
    clearError()
    setDeletingId(postId)
    try {
      await api.delete(`/posts/${postId}`)
      await loadPosts()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Posts</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* New post form — category_id is attached automatically per role. */}
      <form
        onSubmit={handleSubmit}
        style={{ margin: '12px 0', padding: '12px', border: '1px solid #ccc', maxWidth: '560px' }}
      >
        <div>
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ display: 'block', width: '100%' }}
            />
          </label>
        </div>
        <div>
          <label>
            Content
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="5"
              required
              style={{ display: 'block', width: '100%' }}
            />
          </label>
        </div>

        {isSuperAdmin && (
          <div style={{ margin: '8px 0' }}>
            <span style={{ display: 'block', marginBottom: '4px' }}>Scope</span>
            <label style={{ marginRight: '16px' }}>
              <input
                type="radio"
                name="scope"
                checked={postToMyCategory}
                onChange={() => setPostToMyCategory(true)}
              />{' '}
              Post to my category
            </label>
            <label>
              <input
                type="radio"
                name="scope"
                checked={!postToMyCategory}
                onChange={() => setPostToMyCategory(false)}
              />{' '}
              Post globally to all users
            </label>
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Create Post'}
        </button>
      </form>

      {/* Existing posts, newest first (server orders by created_at DESC). */}
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} style={postCardStyle}>
            <h3 style={{ marginTop: '0' }}>{post.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
            <div style={postMetaStyle}>
              <span>By {post.author?.name || '—'}</span>
              <span>{formatDate(post.created_at)}</span>
              {post.category_id === null && (
                <span style={globalBadgeStyle}>Global</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(post.id)}
              disabled={deletingId === post.id}
            >
              {deletingId === post.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))
      )}
    </div>
  )
}

const postCardStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  maxWidth: '640px',
}

const postMetaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '13px',
  color: '#666',
  marginBottom: '8px',
}

const globalBadgeStyle = {
  color: '#2e7d32',
  fontWeight: 'bold',
}

export default Posts
