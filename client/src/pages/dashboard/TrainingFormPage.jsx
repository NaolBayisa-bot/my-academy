import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import Card from '../../components/ui/Card'
import ModuleLessonBuilder from '../../components/training/ModuleLessonBuilder'
import TrainingAccessGrantsPanel from '../../components/training/TrainingAccessGrantsPanel'

export default function TrainingFormPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    difficulty: 'BEGINNER',
    categoryId: '',
    status: 'DRAFT',
    order: 0,
    unlockType: 'OPEN',
  })

  useEffect(() => {
    fetchCategories()
    if (isEdit) fetchTraining()
  }, [id])

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories')
      setCategories(data)
      if (data.length && !isEdit)
        setForm((f) => ({ ...f, categoryId: String(data[0].id) }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories')
    }
  }

  const fetchTraining = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/trainings/${id}`)
      setForm({
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail || '',
        difficulty: data.difficulty,
        categoryId: String(data.categoryId),
        status: data.status,
        order: data.order ?? 0,
        unlockType: data.unlockType || 'OPEN',
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load training')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        description: form.description,
        thumbnail: form.thumbnail || null,
        difficulty: form.difficulty,
        categoryId: parseInt(form.categoryId, 10),
      }
      if (isEdit) {
        await api.patch(`/trainings/${id}`, payload)
        await api.patch(`/trainings/${id}/status`, { status: form.status })
        await api.patch(`/trainings/${id}/order`, { order: form.order })
        await api.patch(`/trainings/${id}/unlock-type`, {
          unlockType: form.unlockType,
        })
      } else {
        await api.post('/trainings', payload)
      }
      navigate('/admin/trainings')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save training')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        {isEdit ? 'Edit Training' : 'Create Training'}
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 dark:border-tech-border bg-transparent p-2 text-slate-900 dark:text-white"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>
          <Input
            label="Thumbnail URL (optional)"
            value={form.thumbnail}
            onChange={(e) =>
              setForm({ ...form, thumbnail: e.target.value })
            }
          />
          <Select
            label="Difficulty"
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            options={[
              { value: 'BEGINNER', label: 'Beginner' },
              { value: 'INTERMEDIATE', label: 'Intermediate' },
              { value: 'ADVANCED', label: 'Advanced' },
            ]}
          />
          <Select
            label="Category"
            value={form.categoryId}
            onChange={(e) =>
              setForm({ ...form, categoryId: e.target.value })
            }
            options={categories.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
            required
          />
          {isEdit && (
            <>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'PUBLISHED', label: 'Published' },
                ]}
              />
              <Select
                label="Unlock Type"
                value={form.unlockType}
                onChange={(e) =>
                  setForm({ ...form, unlockType: e.target.value })
                }
                options={[
                  { value: 'OPEN', label: 'Open (anyone can access)' },
                  {
                    value: 'SEQUENTIAL',
                    label: 'Sequential (complete previous training)',
                  },
                  { value: 'MANUAL', label: 'Manual (admin grants access)' },
                ]}
              />
              <Input
                label="Order (position in category)"
                type="number"
                value={String(form.order)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    order: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={saving}>
              {isEdit ? 'Update Training' : 'Create Training'}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/trainings')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {isEdit && (
        <>
          <ModuleLessonBuilder />
          {form.unlockType === 'MANUAL' && id && (
            <TrainingAccessGrantsPanel trainingId={parseInt(id, 10)} />
          )}
        </>
      )}
    </div>
  )
}
