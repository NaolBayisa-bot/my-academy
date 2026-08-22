import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import AmbientBackground from '../../components/AmbientBackground'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

function SelectCategory() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [selectingId, setSelectingId] = useState(null)
  const [selectError, setSelectError] = useState(null)

  useEffect(() => {
    if (user?.category_id) {
      navigate('/student/dashboard', { replace: true })
    }
  }, [user, navigate])

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
        err.response?.data?.error || 'Failed to select category. Please try again.'
      )
    } finally {
      setSelectingId(null)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-background">
        <AmbientBackground grid={false} />
        <div className="relative z-10">
          <Card>
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">hourglass_bottom</span>
              <p className="text-on-surface">Loading categories...</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground grid={false} />

      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">onboarding</span>
            <span className="meta-label text-sm uppercase">Onboarding</span>
          </div>
          <h1 className="text-4xl font-bold text-on-surface font-headline-lg mt-2">
            Select Your Category
          </h1>
        </div>

        {fetchError && (
          <Alert variant="error" message={fetchError} className="mb-4" />
        )}
        {selectError && (
          <Alert variant="error" message={selectError} className="mb-4" />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const isSelected = selectingId === category.id
            return (
              <Card
                key={category.id}
                padding="p-6"
                className={"cursor-pointer transition-all duration-200 " + (isSelected ? 'border-primary shadow-glow-primary' : 'hover:shadow-glass')}
                onClick={() => !isSelected && handleSelect(category)}
              >
                {isSelected ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-on-primary">check</span>
                    </div>
                    <p className="text-sm text-primary font-medium">Selecting...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-2xl text-on-primary">
                        {category.icon || 'directory'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-on-surface mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">
                      {category.description || 'Discover content in this category'}
                    </p>
                    <Button variant="primary" fullWidth>
                      Select Track
                    </Button>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SelectCategory
