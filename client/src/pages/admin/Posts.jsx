import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/formatters'
import {
  ContentPage,
  PageHeader,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Alert,
  Chip,
} from '../../components/ui'

function PostsSkeleton() {
  return (
    <ContentPage aria-busy="true" aria-label="Loading posts">
      <div className="panel p-5 flex flex-col gap-3">
        <div className="h-4 w-32 rounded bg-[rgba(148,175,211,0.15)] animate-shimmer" />
        <div className="h-24 w-full rounded-xl bg-[rgba(148,175,211,0.1)] animate-shimmer" />
      </div>
    </ContentPage>
  )
}

// Posts page shared by `category_admin` and `super_admin`.
//
//  - category_admin creates posts scoped to their own category — the
//    `category_id` is attached automatically from the authenticated user.
//  - super_admin additionally gets a posting-scope selector: post globally
//    to all users (category_id = null) or into any specific category they
//    pick from the dropdown (the backend already authorizes both). A
//    super_admin sees all posts.
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

  // super_admin-only posting scope: '' = global (category_id null), otherwise a category UUID.
  const [postScope, setPostScope] = useState('')
  const [categories, setCategories] = useState([])

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

  // Category list: powers the super_admin scope dropdown and the scope chip
  // on every post card (public endpoint, safe for both roles).
  useEffect(() => {
    let cancelled = false
    api
      .get('/categories')
      .then((res) => {
        if (!cancelled) setCategories(res.data.categories || [])
      })
      .catch(() => {
        /* chips just show a fallback label; posting still works */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      // `category_id` depends on role + (super_admin) the selected scope:
      // empty string = global (null), otherwise the picked category UUID.
      const categoryId = isSuperAdmin
        ? (postScope || null)
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

  if (loading) {
    return <PostsSkeleton />
  }

  return (
    <ContentPage>
      <PageHeader
        title="Posts"
        subtitle="Create and manage announcements across your academy channels."
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="panel-shell p-5 mb-6 grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="post-title">
          <Input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Post title"
          />
        </Field>

        <Field label="Content" htmlFor="post-content">
          <Textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="5"
            required
            placeholder="Write your message..."
          />
        </Field>

        {isSuperAdmin && (
          <Field
            label="Posting scope"
            htmlFor="post-scope"
            hint={
              <>
                This post will be visible to{' '}
                <span className="font-semibold text-cyan-default">
                  {postScope
                    ? `the ${categories.find((c) => c.id === postScope)?.name || 'selected category'} only`
                    : 'all users across every category'}
                </span>.
              </>
            }
          >
            <Select
              id="post-scope"
              value={postScope}
              onChange={(e) => setPostScope(e.target.value)}
            >
              <option value="">🌐 Global — visible to all users</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Create Post'}
        </Button>
      </form>

      {posts.length === 0 ? (
        <div className="panel-shell p-5 mb-6">
          <p className="page-subtitle">No posts yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="panel p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="eyebrow">Update</p>
                  <h3 className="font-bold text-base m-0">{post.title}</h3>
                </div>
                {post.category_id === null ? (
                  <Chip variant="success" size="sm">🌐 Global</Chip>
                ) : (
                  <Chip variant="cyan" size="sm" className="max-w-[160px] truncate">
                    {categories.find((c) => c.id === post.category_id)?.name || 'Category post'}
                  </Chip>
                )}
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap m-0">{post.content}</p>

              <div className="flex flex-wrap gap-3 text-xs text-muted pt-3 border-t border-[rgba(143,170,205,0.1)]">
                <span>By {post.author?.name || '—'}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
              </div>

              <Button variant="danger" onClick={() => handleDelete(post.id)} disabled={deletingId === post.id}>
                {deletingId === post.id ? 'Deleting...' : 'Delete'}
              </Button>
            </article>
          ))}
        </div>
      )}
    </ContentPage>
  )
}

export default Posts
