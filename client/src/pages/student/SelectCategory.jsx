import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { ContentPage, PageHeader, Chip, Alert } from '../../components/ui'

// Category picker for students.
//  - Initial flow (?change absent): a student with no `category_id` picks one and
//    is then redirected to the dashboard by StudentDashboard's guard.
//  - Change flow (?change=1): a student who has a category but no pending /
//    in_progress enrollment may switch. The backend (selectCategory) already
//    permits this when no active enrollment exists.
function SelectCategory() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const changeMode = searchParams.get('change') === '1'

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [selectingId, setSelectingId] = useState(null)
  const [selectError, setSelectError] = useState(null)

  // In initial-selection mode, a student who already picked a category is sent
  // straight to the dashboard. In change mode we let them switch.
  useEffect(() => {
    if (!changeMode && user?.category_id) {
      navigate('/student/dashboard', { replace: true })
    }
  }, [user, navigate, changeMode])

  // Fetch available categories.
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories')
        setCategories(res.data.categories)
      } catch (err) {
        setFetchError(
          err.response?.data?.error || 'Failed to load categories. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleSelect = async (category) => {
    setSelectingId(category.id)
    setSelectError(null)
    try {
      const res = await api.post('/students/select-category', {
        categoryId: category.id,
      })
      updateUser({ category_id: res.data.user.category_id })
      navigate('/student/dashboard')
    } catch (err) {
      setSelectError(
        err.response?.data?.error ||
          'Failed to select category. Please try again.'
      )
    } finally {
      setSelectingId(null)
    }
  }

  if (loading) {
    return (
      <ContentPage>
        <div className="panel p-5">
          <p>Loading categories...</p>
        </div>
      </ContentPage>
    )
  }

  return (
    <ContentPage>
      <PageHeader
        eyebrow={changeMode ? 'Change category' : 'Start here'}
        title={changeMode ? 'Change Your Category' : 'Select Your Category'}
        action={
          changeMode && (
            <Chip variant="cyan" size="sm">change mode</Chip>
          )
        }
      />

      {changeMode && user?.category_id && (
        <p className="text-sm text-muted m-0 mb-4">
          Currently set to a previous category. Pick another below and its courses
          will appear on your dashboard.
        </p>
      )}

      {fetchError && (
        <div className="mb-6">
          <Alert tone="error">{fetchError}</Alert>
        </div>
      )}
      {selectError && (
        <div className="mb-6">
          <Alert tone="error">{selectError}</Alert>
        </div>
      )}

      <div className="category-picker-grid grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="category-choice flex items-center gap-3 rounded-xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] px-5 py-4 cursor-pointer transition-all duration-200 hover:border-cyan-default/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleSelect(category)}
            disabled={selectingId === category.id}
          >
            <span className="category-choice-icon text-cyan-default text-lg">◈</span>
            <span>{selectingId === category.id ? 'Selecting...' : category.name}</span>
          </button>
        ))}
      </div>
    </ContentPage>
  )
}

export default SelectCategory
