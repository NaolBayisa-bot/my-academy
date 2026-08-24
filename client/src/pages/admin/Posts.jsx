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
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">Posts</h1>
          <p className="page-subtitle text-sm text-muted mt-1.5">Create and manage announcements across your academy channels.</p>
        </div>
      </div>

      {error && <p className="form-error text-red-400 text-sm m-0">{error}</p>}

      <form onSubmit={handleSubmit} className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 form-grid grid gap-4 sm:grid-cols-2">
        <div className="field flex flex-col gap-1.5">
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

        <div className="field flex flex-col gap-1.5">
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
          <div className="field flex flex-col gap-1.5">
            <label>Scope</label>
            <div className="button-row flex flex-wrap items-center gap-2.5 mt-2">
              <label className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={postToMyCategory}
                  onChange={() => setPostToMyCategory(true)}
                />{' '}
                Post to my category
              </label>
              <label className="secondary-btn inline-flex items-center justify-center no-underline border border-[rgba(123,200,255,0.25)] bg-[rgba(12,21,34,0.7)] font-semibold px-5 py-2.5 rounded-xl hover:border-cyan-default/50 hover:bg-[rgba(18,30,46,0.88)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
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

        <button type="submit" className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer" disabled={submitting}>
          {submitting ? 'Saving...' : 'Create Post'}
        </button>
      </form>

      {posts.length === 0 ? (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p className="page-subtitle text-sm text-muted mt-1.5">No posts yet.</p>
        </div>
      ) : (
        <div className="card-grid grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="list-card rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30">
              <div className="card-top flex justify-between items-start gap-4">
                <div>
                  <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Update</p>
                  <h3>{post.title}</h3>
                </div>
                {post.category_id === null && <span className="chip success inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-soft border border-green-default/25 text-green-default">Global</span>}
              </div>

              <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>

              <div className="meta-row flex flex-wrap gap-3 text-xs text-muted pt-3 border-t border-[rgba(143,170,205,0.1)]">
                <span>By {post.author?.name || '—'}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
              </div>

              <button
                type="button"
                className="danger-btn inline-flex items-center justify-center no-underline border border-red-500/30 bg-red-500/10 text-red-300 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
