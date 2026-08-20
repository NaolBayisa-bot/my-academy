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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-violet-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Posts</h1>

      {error && <p className="mb-4 text-red-500">{error}</p>}

      {/* New post form — category_id is attached automatically per role. */}
      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-glass border border-glass-border rounded-xl shadow-glass max-w-md">
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="5"
            required
            className="w-full px-3 py-2 bg-glass border border-glass-border rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {isSuperAdmin && (
          <div className="mb-3">
            <span className="block text-sm font-medium text-slate-300 mb-2">Scope</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  checked={postToMyCategory}
                  onChange={() => setPostToMyCategory(true)}
                  className="text-violet-500"
                />
                <span className="text-slate-300">Post to my category</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  checked={!postToMyCategory}
                  onChange={() => setPostToMyCategory(false)}
                  className="text-violet-500"
                />
                <span className="text-slate-300">Post globally to all users</span>
              </label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Create Post'}
        </button>
      </form>

      {/* Existing posts, newest first (server orders by created_at DESC). */}
      {posts.length === 0 ? (
        <p className="text-slate-400">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-glass border border-glass-border rounded-xl p-4 shadow-glass max-w-md"
            >
              <h3 className="text-xl font-semibold mb-2 text-slate-100">{post.title}</h3>
              <p className="text-slate-300 mb-3 whitespace-pre-wrap">{post.content}</p>
              <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
                <span>By {post.author?.name || '—'}</span>
                <span>{formatDate(post.created_at)}</span>
                {post.category_id === null && (
                  <span className="px-2 py-0.5 text-xs font-medium text-green-600 bg-green-900/20 rounded-full">
                    Global
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(post.id)}
                disabled={deletingId === post.id}
                className="px-3 py-1 text-sm text-red-500 hover:bg-red-900/20 border border-red-500/50 rounded transition-violet disabled:opacity-50"
              >
                {deletingId === post.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Posts
