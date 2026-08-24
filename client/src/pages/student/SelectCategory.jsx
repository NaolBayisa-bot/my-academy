import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

function SelectCategory() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [selectingId, setSelectingId] = useState(null)
  const [selectError, setSelectError] = useState(null)

  // If the student already has a category, skip this page.
  useEffect(() => {
    if (user?.category_id) {
      navigate('/student/dashboard', { replace: true })
    }
  }, [user, navigate])

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
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6">
          <p>Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <div className="page-header mb-6">
        <div>
          <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1.5">Start here</p>
          <h1 className="page-title text-2xl md:text-3xl font-black tracking-tight m-0">Select Your Category</h1>
        </div>
      </div>

      {fetchError && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{fetchError}</p>
        </div>
      )}
      {selectError && (
        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 error-panel border-red-500/30 bg-[rgba(239,68,68,0.08)]">
          <p>{selectError}</p>
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
            <span className="category-choice category-choice-icon text-cyan-default text-lg">◈</span>
            <span>{selectingId === category.id ? 'Selecting...' : category.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SelectCategory