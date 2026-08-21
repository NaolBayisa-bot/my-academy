import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'

export default function AdminResourcesPage() {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const [categoryId, setCategoryId] = useState(null)

  useEffect(() => {
    fetchCategoryAndResources()
  }, [user])

  const fetchCategoryAndResources = async () => {
    try {
      setLoading(true)
      if (user?.approvedCategoryId) {
        setCategoryId(user.approvedCategoryId)
        const { data } = await api.get(
          `/resources/category/${user.approvedCategoryId}`,
        )
        setResources(data)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!categoryId) return
    setSaving(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('title', title)
      if (file) {
        formData.append('file', file)
      } else if (linkUrl) {
        formData.append('linkUrl', linkUrl)
      }
      const { data } = await api.post(
        `/resources/category/${categoryId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      setResources((prev) => [data, ...prev])
      setShowForm(false)
      setTitle('')
      setLinkUrl('')
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create resource')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return
    try {
      await api.delete(`/resources/${id}`)
      setResources((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resource')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Category Resources
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage downloadable resources for your category
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Resource'}
        </Button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Upload File
              </label>
              <input
                type="file"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null)
                  setLinkUrl('')
                }}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-900/20 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100"
              />
            </div>
            <Input
              label="Or paste a link URL"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value)
                setFile(null)
              }}
            />
            <Button type="submit" isLoading={saving}>
              Create Resource
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12" />
        </div>
      ) : resources.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">
            No resources yet. Add your first one above.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {resource.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {resource.fileUrl ? '📄 File' : '🔗 Link'} · Added by{' '}
                  {resource.createdBy?.firstName}{' '}
                  {resource.createdBy?.lastName}
                </p>
              </div>
              <div className="flex gap-2">
                {resource.fileUrl && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="secondary">
                      Download
                    </Button>
                  </a>
                )}
                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="secondary">
                      Open
                    </Button>
                  </a>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(resource.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
