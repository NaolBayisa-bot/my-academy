import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'

export default function StudentTrainingViewPage() {
  const { id } = useParams()
  const [training, setTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [completedLessonIds, setCompletedLessonIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [resources, setResources] = useState([])
  const [loadingResources, setLoadingResources] = useState(true)

  useEffect(() => {
    if (id) {
      fetchTraining()
      fetchResources()
    }
  }, [id])

  const fetchResources = async () => {
    if (!id) return
    try {
      setLoadingResources(true)
      const { data } = await api.get(`/resources/training/${id}`)
      setResources(data)
    } catch {
      // Silently fail - resources are optional
    } finally {
      setLoadingResources(false)
    }
  }

  const fetchTraining = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/trainings/${id}`)
      setTraining(data)
      if (data.modules?.length && data.modules[0].lessons?.length) {
        setActiveLessonId(data.modules[0].lessons[0].id)
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to load training'
      if (err.response?.status === 403) {
        setError(`🔒 ${message}`)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const flattenLessons = () =>
    training ? training.modules.flatMap((m) => m.lessons) : []
  const activeLesson =
    flattenLessons().find((l) => l.id === activeLessonId) || null

  const markComplete = async (lessonId) => {
    setSaving(true)
    try {
      await api.post(`/progress/complete/${lessonId}`)
      setCompletedLessonIds((prev) => [...new Set([...prev, lessonId])])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update progress')
    } finally {
      setSaving(false)
    }
  }

  const unmarkComplete = async (lessonId) => {
    setSaving(true)
    try {
      await api.patch(`/progress/complete/${lessonId}`)
      setCompletedLessonIds((prev) =>
        prev.filter((l) => l !== lessonId),
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update progress')
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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (!training) {
    return null
  }

  const totalLessons = flattenLessons().length
  const completedCount = completedLessonIds.length
  const progressPercent = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          to="/trainings"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary font-mono"
        >
          &larr; Back to Trainings
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
          {training.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          {training.description}
        </p>
      </div>

      {/* Progress summary */}
      <Card className="p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-500 dark:text-slate-400">
              Progress: {completedCount}/{totalLessons} lessons
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-tech-border rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Modules / lessons sidebar */}
        <Card className="lg:col-span-2 p-4">
          <h3 className="font-medium text-slate-900 dark:text-white mb-3">
            Modules
          </h3>
                    <ul className="space-y-4">
            {training.modules.map((module) => (
              <li key={module.id}>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
                  {module.title}
                </p>
                <ul className="pl-1 space-y-1">
                  {module.lessons.map((lesson) => {
                    const isDone = completedLessonIds.includes(lesson.id)
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => setActiveLessonId(lesson.id)}
                          className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded-md text-sm transition-colors ${
                            isDone
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-tech-border'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full border ${
                              isDone
                                ? 'bg-green-500 border-green-500'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          />
                          {lesson.title}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </Card>

        {/* Active lesson */}
        <Card className="lg:col-span-3 p-6">
          {activeLesson ? (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {activeLesson.title}
              </h3>
              {activeLesson.imageUrl && (
                <img
                  src={activeLesson.imageUrl}
                  alt={activeLesson.title}
                  className="rounded-md mb-4 max-h-[400px] w-full object-cover"
                />
              )}
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {activeLesson.content}
              </p>
              <div className="flex gap-3 mt-6">
                {!completedLessonIds.includes(activeLesson.id) ? (
                  <Button
                    onClick={() => markComplete(activeLesson.id)}
                    isLoading={saving}
                  >
                    Mark as complete
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => unmarkComplete(activeLesson.id)}
                    isLoading={saving}
                  >
                    Unmark
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500">
              Select a lesson to start learning.
            </p>
          )}
        </Card>

        {/* Training Resources */}
        <Card className="lg:col-span-3 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Training Resources
          </h2>
          {loadingResources ? (
            <div className="flex justify-center py-4">
              <Spinner className="h-6 w-6" />
            </div>
          ) : resources.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No additional resources for this training.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-tech-border rounded-md"
                >
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      {resource.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
