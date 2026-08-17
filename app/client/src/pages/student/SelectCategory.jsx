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
    return <div>Loading categories...</div>
  }

  return (
    <div>
      <h1>Select Your Category</h1>
      {fetchError && <p style={{ color: 'red' }}>{fetchError}</p>}
      {selectError && <p style={{ color: 'red' }}>{selectError}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleSelect(category)}
            disabled={selectingId === category.id}
            style={{ padding: '24px', fontSize: '16px', cursor: 'pointer' }}
          >
            {selectingId === category.id ? 'Selecting...' : category.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SelectCategory