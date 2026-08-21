import { useState, useEffect } from 'react'
import api from '../../services/api'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Spinner from '../ui/Spinner'

export default function TrainingAccessGrantsPanel({ trainingId }) {
  const [grants, setGrants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [granting, setGranting] = useState(null)

  useEffect(() => {
    fetchGrants()
  }, [trainingId])

  const fetchGrants = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/trainings/${trainingId}/access-grants`)
      setGrants(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load access grants')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchEmail.trim()) return
    setSearching(true)
    try {
      const { data } = await api.get('/users/search', {
        params: { email: searchEmail },
      })
      const students = Array.isArray(data) ? data : []
      setSearchResults(students)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search students')
    } finally {
      setSearching(false)
    }
  }

  const handleGrant = async (userId) => {
    setGranting(userId)
    try {
      const { data } = await api.post(`/trainings/${trainingId}/access-grants`, {
        userId,
      })
      setGrants((prev) => [
        {
          id: data.id,
          userId: data.user.id,
          grantedAt: data.grantedAt,
          user: data.user,
          grantedBy: data.grantedBy,
        },
        ...prev,
      ])
      setSearchResults([])
      setSearchEmail('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to grant access')
    } finally {
      setGranting(null)
    }
  }

  const handleRevoke = async (grantId) => {
    try {
      await api.delete(`/trainings/${trainingId}/access-grants/${grantId}`)
      setGrants((prev) => prev.filter((g) => g.id !== grantId))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke access')
    }
  }

  return (
    <Card className="p-6 mt-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Manual Access Grants
      </h3>

      {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}

      {/* Add student */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search student by email..."
          value={searchEmail}
          onChange={(e) => {
            setSearchEmail(e.target.value)
            setSearchResults([])
          }}
          className="flex-1 rounded-md border border-slate-300 dark:border-tech-border bg-transparent p-2 text-sm text-slate-900 dark:text-white"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          isLoading={searching}
          disabled={!searchEmail.trim()}
        >
          Search
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="mb-4 border border-slate-200 dark:border-tech-border rounded-md divide-y divide-slate-200 dark:divide-tech-border">
          {searchResults.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between px-3 py-2"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {student.firstName} {student.lastName} ({student.email})
              </span>
              <Button
                size="sm"
                onClick={() => handleGrant(student.id)}
                isLoading={granting === student.id}
              >
                Grant
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Grants list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner className="h-6 w-6" />
        </div>
      ) : grants.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No students have been granted access yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-tech-border">
          {grants.map((grant) => (
            <li
              key={grant.id}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {grant.user.firstName} {grant.user.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {grant.user.email}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRevoke(grant.id)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
