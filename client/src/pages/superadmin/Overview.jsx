import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { formatDate } from '../../utils/formatters'
import { StatCard, SkeletonBlock, Chip } from '../../components/ui'

// Super admin statistical dashboard. Data from GET /api/admin/overview:
// platform counts, global enrollment status distribution + completion rate,
// completions/students per category, courses per category, and recent signups.
//
// The "Category explorer" section shows the courses created in each category;
// expanding a course lists the students enrolled in it (data comes from the
// existing GET /api/admin/category/:categoryId/students endpoint, inverted
// client-side into a course -> students mapping and cached per category).

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#38d7ff',
  completed: '#2dd4a7',
  rejected: '#f472b6',
}

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading overview">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-3 w-36" />
        <SkeletonBlock className="h-8 w-64 max-w-full" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 max-sm:grid-cols-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="stat-card">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel h-56" />
        <div className="panel h-56" />
      </div>
      <div className="panel h-80" />
    </div>
  )
}

function statusChip(status) {
  const map = {
    completed: 'success',
    pending: 'warning',
    rejected: 'danger',
    in_progress: 'cyan',
  }
  return (
    <Chip variant={map[status] || 'neutral'} className="shrink-0">
      {STATUS_LABELS[status] || status}
    </Chip>
  )
}

// One category accordion in the explorer.
function CategoryExplorerItem({ category, expanded, onToggle, studentsByCategory, isLoadingCategory }) {
  const [openCourseId, setOpenCourseId] = useState(null)
  const courses = category.courses || []

  // Students enrolled in a course: derived from the category students payload
  // (each student carries their enrollments). Returns [{name, email, status, enrolled_at}].
  const studentsInCourse = (courseId) => {
    const students = studentsByCategory[category.category_id] || []
    const rows = []
    for (const s of students) {
      for (const e of s.enrollments || []) {
        if (e.course_id === courseId) {
          rows.push({
            key: `${s.id}-${e.id}`,
            name: s.name,
            email: s.email,
            status: e.status,
            enrolled_at: e.enrolled_at,
          })
        }
      }
    }
    return rows
  }

  return (
    <div className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.5)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-4 px-4 py-3.5 bg-transparent border-0 cursor-pointer text-left transition-colors hover:bg-[rgba(15,27,40,0.5)] focus-visible:outline-2 focus-visible:outline-cyan-default"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl grid place-items-center text-base bg-cyan-soft text-cyan-default shrink-0" aria-hidden="true">🛡️</span>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{category.name}</span>
            <span className="text-xs text-muted">
              {courses.length} course{courses.length === 1 ? '' : 's'} · {courses.reduce((s, c) => s + c.enrollments, 0)} enrollments
            </span>
          </div>
        </div>
        <span className="text-muted shrink-0 transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} aria-hidden="true">▾</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-[rgba(143,170,205,0.08)] pt-3">
          {courses.length === 0 ? (
            <p className="text-sm text-muted m-0 py-4 text-center">No courses created in this category yet.</p>
          ) : (
            courses.map((course) => {
              const courseOpen = openCourseId === course.id
              return (
                <div key={course.id} className="rounded-xl border border-[rgba(143,170,205,0.1)] bg-[rgba(13,22,35,0.6)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenCourseId(courseOpen ? null : course.id)}
                    aria-expanded={courseOpen}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 bg-transparent border-0 cursor-pointer text-left transition-colors hover:bg-[rgba(15,27,40,0.5)] focus-visible:outline-2 focus-visible:outline-cyan-default"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{course.title}</span>
                      <span className="text-[11px] text-muted">created {formatDate(course.createdAt)}</span>
                    </div>
                    <Chip variant="cyan" size="sm">👥 {course.enrollments} enrolled</Chip>
                  </button>

                  {courseOpen && (
                    <div className="border-t border-[rgba(143,170,205,0.08)] px-3.5 py-3 bg-[rgba(9,17,27,0.4)]">
                      {isLoadingCategory ? (
                        <div className="flex flex-col gap-2" aria-busy="true">
                          {[0, 1].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                              <SkeletonBlock className="h-7 w-7 rounded-full shrink-0" />
                              <SkeletonBlock className="h-3.5 flex-1 max-w-[160px]" />
                              <SkeletonBlock className="h-3.5 w-16" />
                            </div>
                          ))}
                        </div>
                      ) : studentsInCourse(course.id).length === 0 ? (
                        <p className="text-xs text-muted m-0 text-center py-2">No students enrolled in this course yet.</p>
                      ) : (
                        <ul className="list-none m-0 p-0 flex flex-col divide-y divide-[rgba(143,170,205,0.06)]">
                          {studentsInCourse(course.id).map((row) => (
                            <li key={row.key} className="flex items-center gap-3 py-2">
                              <span className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold shrink-0 bg-cyan-soft text-cyan-default" aria-hidden="true">
                                {(row.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-medium block truncate">{row.name}</span>
                                <span className="text-xs text-muted block truncate">{row.email}</span>
                              </div>
                              <span className="text-xs text-muted shrink-0 hidden sm:block">
                                {formatDate(row.enrolled_at)}
                              </span>
                              {statusChip(row.status)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function Overview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Category explorer state
  const [expandedCategoryId, setExpandedCategoryId] = useState(null)
  const [studentsByCategory, setStudentsByCategory] = useState({}) // categoryId -> students[]
  const [loadingCategory, setLoadingCategory] = useState(null)
  const [courseSearch, setCourseSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    const loadOverview = async () => {
      try {
        const res = await api.get('/admin/overview')
        if (!cancelled) setStats(res.data)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load overview. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadOverview()
    return () => {
      cancelled = true
    }
  }, [])

  // Lazily load (and cache) a category's students when the accordion opens.
  const toggleCategory = async (category) => {
    const id = category.category_id
    if (expandedCategoryId === id) {
      setExpandedCategoryId(null)
      return
    }
    setExpandedCategoryId(id)
    if (studentsByCategory[id]) return // cached
    setLoadingCategory(id)
    try {
      const res = await api.get(`/admin/category/${id}/students`)
      setStudentsByCategory((prev) => ({ ...prev, [id]: res.data.students || [] }))
    } catch {
      setStudentsByCategory((prev) => ({ ...prev, [id]: [] }))
    } finally {
      setLoadingCategory(null)
    }
  }

  if (loading) {
    return <OverviewSkeleton />
  }

  if (error) {
    return <p className="alert alert-error">{error}</p>
  }

  const completionsPerCategory = stats.completionsPerCategory || []
  const studentsPerCategory = stats.studentsPerCategory || []
  const coursesPerCategory = stats.coursesPerCategory || []
  const byStatus = stats.enrollmentsByStatus || {}
  const totalEnrollments = stats.totalEnrollments || 0

  const totalCompletions = completionsPerCategory.reduce(
    (sum, item) => sum + Number(item.completions || 0),
    0
  )

  // Donut segments: global enrollment status distribution.
  const statusSegments = [
    { key: 'in_progress', value: byStatus.in_progress || 0 },
    { key: 'completed', value: byStatus.completed || 0 },
    { key: 'pending', value: byStatus.pending || 0 },
    { key: 'rejected', value: byStatus.rejected || 0 },
  ]
  let acc = 0
  const donutBackground = totalEnrollments
    ? statusSegments
        .filter((s) => s.value > 0)
        .map((s) => {
          const start = (acc / totalEnrollments) * 100
          acc += s.value
          const end = (acc / totalEnrollments) * 100
          return `${STATUS_COLORS[s.key]} ${start}% ${end}%`
        })
        .join(', ')
    : '#102033'
  const donutSummary = statusSegments.map((s) => `${s.value} ${STATUS_LABELS[s.key]}`).join(', ')

  // Category explorer filtering (by category or course title).
  const q = courseSearch.trim().toLowerCase()
  const visibleCategories = coursesPerCategory
    .map((c) => ({
      ...c,
      courses: q ? c.courses.filter((course) => course.title.toLowerCase().includes(q)) : c.courses,
    }))
    .filter((c) => !q || c.courses.length > 0 || c.name.toLowerCase().includes(q))

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="animate-fade-up">
        <p className="eyebrow">Executive summary</p>
        <h1 className="page-title text-2xl md:text-3xl">Platform Overview</h1>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 max-sm:grid-cols-1" aria-label="Platform totals">
        <StatCard icon="👥" iconBg="bg-cyan-soft text-cyan-default" title="Students" value={stats.totalStudents} subtitle="registered learners" />
        <StatCard icon="🛡️" iconBg="bg-purple-500/10 text-purple" title="Admins" value={stats.totalAdmins} subtitle="category admins" />
        <StatCard icon="📚" iconBg="bg-green-soft text-green-default" title="Courses" value={stats.totalCourses} subtitle="across all categories" />
        <StatCard icon="📝" iconBg="bg-yellow-500/10 text-yellow-300" title="Lessons" value={stats.totalLessons} subtitle="learning modules" />
        <StatCard icon="🎓" iconBg="bg-[rgba(56,215,255,0.12)] text-cyan-default" title="Enrollments" value={totalEnrollments} subtitle="all time" />
        <StatCard icon="🎯" iconBg="bg-pink-500/10 text-pink-300" title="Completion rate" value={`${stats.completionRate || 0}%`} subtitle="of all enrollments" />
      </div>

      {/* Analytics row 1: status donut + completions per category bars */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold m-0 text-base">Enrollment status</h3>
            <Chip variant="success" size="sm">{totalEnrollments} total</Chip>
          </div>

          {totalEnrollments === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No enrollments yet.</p>
          ) : (
            <div
              className="flex items-center gap-8 flex-wrap"
              role="img"
              aria-label={`Enrollment status distribution: ${donutSummary}`}
            >
              <div className="w-40 h-40 rounded-full grid place-items-center shrink-0 transition-transform duration-200 hover:scale-[1.03]" style={{ background: `conic-gradient(${donutBackground})` }}>
                <div className="w-24 h-24 rounded-full bg-[#0a1524] grid place-items-center leading-tight text-center">
                  <strong className="text-2xl font-extrabold block">{stats.completionRate || 0}%</strong>
                  <span className="text-[10px] uppercase tracking-wider text-muted">completed</span>
                </div>
              </div>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5 text-sm flex-1 min-w-[160px]">
                {statusSegments.map((s) => (
                  <li key={s.key} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[s.key] }} aria-hidden="true" />
                    <span className="text-muted flex-1">{STATUS_LABELS[s.key]}</span>
                    <span className="text-xs text-muted w-9 text-right">{totalEnrollments ? Math.round((s.value / totalEnrollments) * 100) : 0}%</span>
                    <strong className="w-6 text-right">{s.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="panel p-5">
          <h3 className="font-bold m-0 text-base mb-4">Completions per category</h3>
          {completionsPerCategory.length === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No completions yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {completionsPerCategory.map((c, i) => {
                const max = Math.max(...completionsPerCategory.map((x) => Number(x.completions || 0)), 1)
                const pct = Math.round((Number(c.completions || 0) / max) * 100)
                const colors = ['#38d7ff', '#2dd4a7', '#9c7bff', '#f59e0b', '#f472b6']
                return (
                  <div key={c.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm gap-3">
                      <span className="truncate">{c.name}</span>
                      <strong className="shrink-0">{c.completions}</strong>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(15,27,40,0.8)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Category explorer */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <h3 className="font-bold m-0 text-base">Category explorer</h3>
          <input
            type="search"
            placeholder="Search categories or courses..."
            value={courseSearch}
            onChange={(ev) => setCourseSearch(ev.target.value)}
            aria-label="Search categories or courses"
            className="input-field max-w-xs"
          />
        </div>
        {visibleCategories.length === 0 ? (
          <p className="text-sm text-muted text-center py-8 m-0">No categories match your search.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleCategories.map((category) => (
              <CategoryExplorerItem
                key={category.category_id}
                category={category}
                expanded={expandedCategoryId === category.category_id}
                onToggle={() => toggleCategory(category)}
                studentsByCategory={studentsByCategory}
                isLoadingCategory={loadingCategory === category.category_id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Analytics row 2: students per category + recent signups */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold m-0 text-base">Students per category</h3>
            <Chip variant="cyan" size="sm">{stats.totalStudents} students</Chip>
          </div>
          {studentsPerCategory.length === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {studentsPerCategory.map((c) => {
                const max = Math.max(...studentsPerCategory.map((x) => Number(x.students || 0)), 1)
                const pct = Math.round((Number(c.students || 0) / max) * 100)
                return (
                  <div key={c.category_id || c.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm gap-3">
                      <span className="truncate">{c.name}</span>
                      <strong className="shrink-0">{c.students}</strong>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(15,27,40,0.8)] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-default to-green-default transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="panel p-5">
          <h3 className="font-bold m-0 text-base mb-4">Recent signups</h3>
          {(stats.recentStudents || []).length === 0 ? (
            <p className="text-sm text-muted text-center py-8 m-0">No students yet.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col divide-y divide-[rgba(143,170,205,0.08)]">
              {stats.recentStudents.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-default to-purple text-[#02131f] font-black grid place-items-center text-sm" aria-hidden="true">
                    {(s.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium block truncate">{s.name}</span>
                    <span className="text-xs text-muted block truncate">{s.category || 'Uncategorized'} · joined {formatDate(s.joined_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Content totals strip */}
      <div className="grid gap-4 grid-cols-3 max-sm:grid-cols-1">
        {[['📢 Posts published', stats.totalPosts], ['🛡️ Categories', completionsPerCategory.length], ['🎓 Completions', totalCompletions]].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.6)] px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm text-muted">{label}</span>
            <strong className="text-lg">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Overview
