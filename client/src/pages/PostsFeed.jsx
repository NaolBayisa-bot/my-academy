import { useEffect, useState } from 'react'
import api from '../api/axios'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

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
          setError(err.response?.data?.error || 'Failed to load posts. Please try again.')
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

  const timeAgo = (iso) => {
    try {
      const date = new Date(iso)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return 'just now'
      if (diffMins < 60) {
        const plural = diffMins > 1 ? 's' : ''
        return diffMins + ' minute' + plural + ' ago'
      }

      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) {
        const plural = diffHours > 1 ? 's' : ''
        return diffHours + ' hour' + plural + ' ago'
      }

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return iso
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-primary">Loading posts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-on-surface mb-6 font-headline-lg">
        Your Feed
      </h1>

      {posts.length === 0 ? (
        <p className="text-on-surface-variant">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} padding="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-sm font-medium text-on-primary">
                  {post.author?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium text-on-surface">
                      {post.author?.name || 'Unknown author'}
                    </span>
                    <span className="mx-1 text-on-surface-variant">•</span>
                    <span className="text-on-surface-variant">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <Badge status="global" className="mt-1">
                    {categoryLabel(post)}
                  </Badge>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-on-surface mb-2">
                {post.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {post.content}
              </p>

              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">favorite_border</span>
                  <span className="text-sm">Like</span>
                </button>
                <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">chat_bubble_outline</span>
                  <span className="text-sm">Comment</span>
                </button>
                <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">save</span>
                  <span className="text-sm">Save</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default PostsFeed
