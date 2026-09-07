import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { ContentPage, PageHeader, Button, Chip, SkeletonBlock, Alert } from '../../components/ui'
import { formatDate, relativeTime } from '../../utils/formatters'

// Student course-completion history. Shows completed enrollments grouped by
// year, with a summary header, per-course lesson counts and relative time.

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading history">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-3 w-36" />
        <SkeletonBlock className="h-8 w-64 max-w-full" />
        <SkeletonBlock className="h-3 w-48" />
      </div>
      <div className="panel p-5 flex flex-col gap-4">
        <SkeletonBlock className="h-4 w-24" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-[rgba(143,170,205,0.1)] bg-[rgba(9,17,27,0.5)] p-4 flex flex-col gap-3">
            <SkeletonBlock className="h-4 w-3/5" />
            <SkeletonBlock className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

function History() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/students/my-history')
        if (!cancelled) setEnrollments(res.data.enrollments || [])
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load history. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Group completed enrollments by year of completion.
  const groups = enrollments.reduce((acc, enrollment) => {
    const year = new Date(enrollment.completed_at)
    const key = Number.isNaN(year.getTime()) ? 'Other' : year.getFullYear()
    if (!acc[key]) acc[key] = []
    acc[key].push(enrollment)
    return acc
  }, {})
  const orderedYears = Object.keys(groups).sort((a, b) => b - a)
  const totalLessons = enrollments.reduce((sum, e) => sum + (e.course?.lessonsCount || 0), 0)

  if (loading) {
    return <ContentPage className="max-w-[1100px]"><HistorySkeleton /></ContentPage>
  }

  if (error) {
    return <ContentPage className="max-w-[1100px]"><Alert tone="error">{error}</Alert></ContentPage>
  }

  return (
    <ContentPage className="max-w-[1100px]">
      <PageHeader
        eyebrow="Progress tracker"
        title="My History"
        subtitle={
          <>
            You have completed <strong className="text-green-default">{enrollments.length}</strong> course{enrollments.length === 1 ? '' : 's'}
            {totalLessons > 0 && <> across <strong className="text-green-default">{totalLessons}</strong> lesson{totalLessons === 1 ? '' : 's'}</>}.
          </>
        }
      />

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-center py-12">
          <span className="text-4xl" aria-hidden="true">🌱</span>
          <p className="text-sm text-muted max-w-xs m-0">
            You have not completed any courses yet. Start learning and your completed courses will appear here.
          </p>
          <Button renderAs={Link} to="/student/browse" size="sm">
            Browse courses →
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orderedYears.map((year) => (
            <section key={year} aria-label={year + ' completions'}>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted m-0 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-default" aria-hidden="true" />
                {year}
                <span className="font-normal text-muted/70">· {groups[year].length}</span>
              </h2>
              <div className="card-grid grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {groups[year].map((enrollment) => (
                  <article
                    key={enrollment.id}
                    className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-green-default/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-base m-0 leading-snug">
                        {enrollment.course?.title || 'Untitled Course'}
                      </h3>
                      <Chip variant="success" size="sm" className="uppercase font-bold text-[10px] shrink-0">
                        <span aria-hidden="true">✓</span> Completed
                      </Chip>
                    </div>

                    {enrollment.course?.description && (
                      <p className="text-xs text-muted leading-relaxed m-0 line-clamp-2">
                        {enrollment.course.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted pt-3 border-t border-[rgba(143,170,205,0.1)] mt-auto">
                      {enrollment.course?.category?.name && (
                        <span className="text-cyan-default">{enrollment.course.category.name}</span>
                      )}
                      {enrollment.course?.lessonsCount > 0 && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span>🎓 {enrollment.course.lessonsCount} lessons</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-muted m-0">
                      completed <span className="font-medium text-green-default">{relativeTime(enrollment.completed_at)}</span>
                      <span className="text-muted/70"> · {formatDate(enrollment.completed_at)}</span>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </ContentPage>
  )
}

export default History
