import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'

export default function StudentResourcesPage() {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResources()
  }, [user])

  const fetchResources = async () => {
    try {
      setLoading(true)
      if (user?.approvedCategoryId) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Resources
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Downloadable materials for your category
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-12 w-12" />
        </div>
      ) : resources.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">
            No resources available yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="p-5 flex flex-col gap-3"
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
              <div>
                {resource.fileUrl && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm">Download</Button>
                  </a>
                )}
                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm">Open Link</Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
