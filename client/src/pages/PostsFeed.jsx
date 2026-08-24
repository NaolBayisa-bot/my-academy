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
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Community</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">Posts</h1>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="section-shell empty-state rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 text-center py-10">
          <p>No posts yet.</p>
        </div>
      ) : (
        <div className="card-grid single-column-grid grid gap-5 grid-cols-1">
          {posts.map((post) => (
            <article
              key={post.id}
              className="list-card post-card rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-colors duration-200 hover:border-cyan-default/30"
            >
              <div className="card-top flex justify-between items-start gap-4">
                <div className="info-block flex flex-col gap-1">
                  <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0">{categoryLabel(post)}</p>
                  <h3 className="font-bold text-base m-0">{post.title}</h3>
                </div>
                <span className="chip neutral inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(148,175,211,0.12)] border border-[rgba(143,170,205,0.18)] text-muted">New</span>
              </div>

              <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0">{post.content}</p>

              <div className="meta-row flex flex-wrap gap-3 text-xs text-muted pt-3 border-t border-[rgba(143,170,205,0.1)]">
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
