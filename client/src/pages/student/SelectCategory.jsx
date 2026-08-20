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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-violet-500">Loading categories...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-violet-500">Select Your Category</h1>
      
      {fetchError && <p className="mb-4 text-red-500">{fetchError}</p>}
      {selectError && <p className="mb-4 text-red-500">{selectError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleSelect(category)}
            disabled={selectingId === category.id}
            className={`p-6 text-left text-lg font-medium rounded-xl transition-violet ${
              selectingId === category.id
                ? 'bg-slate-800 cursor-not-allowed'
                : 'bg-glass border border-glass-border hover:bg-slate-800 cursor-pointer'
            }`}
          >
            {selectingId === category.id ? 'Selecting...' : category.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SelectCategory
