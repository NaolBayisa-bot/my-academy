import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import FormField from '../../components/ui/FormField'
import EmptyState from '../../components/ui/EmptyState'

function Posts() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [postToMyCategory, setPostToMyCategory] = useState(true)

  const [deletingId, setDeletingId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const clearError = () => setError(null)

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
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load posts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      const categoryId = isSuperAdmin
        ? postToMyCategory ? user?.category_id : null
        : user?.category_id

      await api.post('/posts', { title, content, category_id: categoryId })
      setTitle('')
      setContent('')
      setPostToMyCategory(true)
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
      await api.delete('/posts/' + postId)
      await loadPosts()
      setShowDeleteConfirm(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 p-6">
          <p className="text-on-surface">Loading posts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10 p-6">
          <Alert variant="error" message={error} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />
      <div className="relative z-10 p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-on-surface mb-6 font-headline-lg">Posts</h1>

        <Card className="mb-6">
          <form onSubmit={handleSubmit}>
            <FormField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <FormField
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              as="textarea"
              rows={5}
              required
            />

            {isSuperAdmin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Scope</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="scope"
                      checked={postToMyCategory}
                      onChange={() => setPostToMyCategory(true)}
                      className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-on-surface">Post to my category</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="scope"
                      checked={!postToMyCategory}
                      onChange={() => setPostToMyCategory(false)}
                      className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-on-surface">Post globally</span>
                  </label>
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" loading={submitting}>
              {submitting ? 'Creating...' : 'Create Post'}
            </Button>
          </form>
        </Card>

        {posts.length === 0 ? (
          <EmptyState icon="article" title="No posts yet." message="Create a post to get the conversation started." />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <h3 className="text-lg font-semibold text-on-surface mb-2">{post.title}</h3>
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap mb-3">{post.content}</p>

                <div className="flex items-center gap-3 text-sm text-on-surface-variant mb-3">
                  <span>By {post.author?.name || '-'}</span>
                  <span>{formatDate(post.created_at)}</span>
                  {post.category_id === null && <Badge status="completed">Global</Badge>}
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { setDeletingId(post.id); setShowDeleteConfirm(post.id) }}
                  disabled={deletingId === post.id || submitting}
                >
                  {deletingId === post.id ? 'Deleting...' : 'Delete'}
                </Button>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={showDeleteConfirm !== null}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Post"
        >
          <p className="text-on-surface mb-4">
            Are you sure you want to delete post <strong className="text-on-surface">"{posts.find((p) => p.id === deletingId)?.title}"</strong>?
            <br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deletingId)}>Delete</Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default Posts
