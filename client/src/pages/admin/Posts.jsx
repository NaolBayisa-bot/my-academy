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
    <div className="content-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Posts</h1>
          <p className="page-subtitle">Create and manage announcements across your academy channels.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="section-shell form-grid">
        <div className="field">
          <label htmlFor="post-title">Title</label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Post title"
          />
        </div>

        <div className="field">
          <label htmlFor="post-content">Content</label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="5"
            required
            placeholder="Write your message..."
          />
        </div>

        {isSuperAdmin && (
          <div className="field">
            <label>Scope</label>
            <div className="button-row">
              <label className="secondary-btn">
                <input
                  type="radio"
                  name="scope"
                  checked={postToMyCategory}
                  onChange={() => setPostToMyCategory(true)}
                />{' '}
                Post to my category
              </label>
              <label className="secondary-btn">
                <input
                  type="radio"
                  name="scope"
                  checked={!postToMyCategory}
                  onChange={() => setPostToMyCategory(false)}
                />{' '}
                Post globally
              </label>
            </div>
          </div>
        )}

        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Saving...' : 'Create Post'}
        </button>
      </form>

      {posts.length === 0 ? (
        <div className="section-shell">
          <p className="page-subtitle">No posts yet.</p>
        </div>
      ) : (
        <div className="card-grid">
          {posts.map((post) => (
            <article key={post.id} className="list-card">
              <div className="card-top">
                <div>
                  <p className="eyebrow">Update</p>
                  <h3>{post.title}</h3>
                </div>
                {post.category_id === null && <span className="chip success">Global</span>}
              </div>

              <p className="post-body" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>

              <div className="meta-row">
                <span>By {post.author?.name || '—'}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
              </div>

              <button
                type="button"
                className="danger-btn"
                onClick={() => handleDelete(post.id)}
                disabled={deletingId === post.id}
              >
                {deletingId === post.id ? 'Deleting...' : 'Delete'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Posts
