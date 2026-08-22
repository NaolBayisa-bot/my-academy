import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'

export default function CourseFormPage() {
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
    categoryId: '',
  })

  useEffect(() => {
    fetchCategories()
    if (isEdit) fetchCourse()
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

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/courses?categoryId=${user?.category_id}`)
      const courses = data.courses || data
      const course = courses.find(c => c.id === id)
      if (course) {
        setForm({
          title: course.title || '',
          description: course.description || '',
          categoryId: String(course.category_id || courses[0]?.id),
        })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course')
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
        categoryId: parseInt(form.categoryId, 10),
      }
      if (isEdit) {
        await api.patch(`/courses/${id}`, payload)
      } else {
        await api.post('/courses', payload)
      }
      navigate('/admin/courses')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course')
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
      <Card>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          {isEdit ? 'Edit Course' : 'Create Course'}
        </h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Select
            label="Category"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            options={categories.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={saving}>
              {isEdit ? 'Update Course' : 'Create Course'}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/courses')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}