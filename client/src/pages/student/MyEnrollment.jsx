import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import StatusChip from '../../components/student/StatusChip'
import ProgressBarRing from '../../components/student/ProgressBarRing'
import CheckCircle from '../../components/student/CheckCircle'
import SkeletonRows from '../../components/student/SkeletonRows'
import VideoModal from '../../components/student/VideoModal'
import ConfettiBurst from '../../components/student/ConfettiBurst'
import { PageHeader, Button, Alert } from '../../components/ui'

const POLL_INTERVAL_MS = 30_000
const CONFETTI_DURATION_MS = 5200

function MyEnrollment() {
  const [enrollment, setEnrollment] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingId, setCompletingId] = useState(null)
  // Status-transition notification: 'approved' | 'rejected' | null
  const [statusNotice, setStatusNotice] = useState(null)
  const prevStatusRef = useRef(undefined)

  // --- Learning-workspace UI state ----------------------------------------
  // Lesson ids completed optimistically (reconciled against the server).
  const [pendingComplete, setPendingComplete] = useState(() => new Set())
  // Which module accordions are open: { [moduleId]: boolean }
  const [expandedModules, setExpandedModules] = useState({})
  const accordionInitRef = useRef(null)
  // Currently open video modal: { title, url } | null
  const [activeLesson, setActiveLesson] = useState(null)
  // One-shot completion celebration
  const [showConfetti, setShowConfetti] = useState(false)
  const celebratedRef = useRef(false)
  const confettiTimerRef = useRef(null)

  const celebrateOnce = () => {
    if (celebratedRef.current) return
    celebratedRef.current = true
    setShowConfetti(true)
    clearTimeout(confettiTimerRef.current)
    confettiTimerRef.current = setTimeout(
      () => setShowConfetti(false),
      CONFETTI_DURATION_MS
    )
  }

  const loadEnrollment = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const res = await api.get('/students/my-enrollment')
      const next = res.data.enrollment

      // Detect a status transition caused by an admin action (approve /
      // reject / mark-complete) so we can notify or celebrate.
      if (prevStatusRef.current === undefined) {
        prevStatusRef.current = next ? next.status : null
      } else {
        const prev = prevStatusRef.current
        const now = next ? next.status : null
        if (prev && now && prev !== now) {
          if (now === 'in_progress') setStatusNotice('approved')
          else if (now === 'rejected') setStatusNotice('rejected')
          else if (now === 'completed') celebrateOnce()
          else setStatusNotice(null)
        }
        prevStatusRef.current = now
      }

      setEnrollment(next)
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to load your enrollment. Please try again.'
      )
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Mount: initial fetch + poll/tab-focus refresh so admin approval appears
  // without a manual reload.
  useEffect(() => {
    loadEnrollment(true)
    const intervalId = setInterval(() => loadEnrollment(), POLL_INTERVAL_MS)
    const onFocus = () => loadEnrollment()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      clearTimeout(confettiTimerRef.current)
    }
  }, [])

  // Load the progress summary while enrolled. Re-runs whenever a new
  // enrollment object arrives so bars/checkmarks stay in sync. Also loaded
  // for completed enrollments so a finished course can be reviewed with its
  // lessons shown as done/unlocked.
  useEffect(() => {
    if (
      enrollment &&
      (enrollment.status === 'in_progress' || enrollment.status === 'completed')
    ) {
      api
        .get(`/enrollments/${enrollment.id}/progress`)
        .then((res) => setProgress(res.data))
        .catch((err) =>
          setError(
            err.response?.data?.error ||
              'Failed to load progress. Please try again.'
          )
        )
    } else {
      setProgress(null)
    }
  }, [enrollment])

  // ----- Derived learning data (null-safe during the loading phase) -------
  const course = enrollment?.course
  const modulesList = course?.modules || []
  const status = enrollment?.status

  const flatLessons = modulesList.flatMap((m) =>
    (m.lessons || []).map((l) => ({
      ...l,
      moduleId: m.id,
      moduleTitle: m.title,
    }))
  )
  const serverCompleted = new Set(progress?.completedLessonIds || [])
  const completedIds = new Set([...serverCompleted, ...pendingComplete])
  const totalLessons = progress?.totalLessons ?? flatLessons.length
  const completedCount = Math.min(totalLessons, completedIds.size)
  const percentage =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const nextUp = flatLessons.find((l) => !completedIds.has(l.id)) || null

  // Sequential unlock: a lesson is accessible only if it is already completed
  // (allowed for review) or it is the current "next up" lesson. Everything
  // later in the curriculum stays locked until the current one is completed.
  const isLessonUnlocked = (lesson) =>
    !!lesson &&
    (completedIds.has(lesson.id) || lesson.id === nextUp?.id)

  // Reconcile: drop pending ids the server has confirmed, silently.
  useEffect(() => {
    setPendingComplete((prev) => {
      if (prev.size === 0) return prev
      let changed = false
      const n = new Set(prev)
      for (const id of prev) {
        if (serverCompleted.has(id)) {
          n.delete(id)
          changed = true
        }
      }
      return changed ? n : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  // Initialize the accordion once per enrollment: open the module holding
  // the next incomplete lesson (or the first module when everything's done).
  useEffect(() => {
    const key = enrollment?.id
    if (!key || accordionInitRef.current === key) return undefined
    accordionInitRef.current = key
    const target = nextUp?.moduleId || modulesList[0]?.id
    if (target) {
      setExpandedModules({ [target]: true })
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment?.id, nextUp?.moduleId])

  const toggleModule = (id) =>
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }))

  const ensureModuleOpen = (moduleId) =>
    setExpandedModules((prev) => ({ ...prev, [moduleId]: true }))

  const continueLearning = () => {
    if (!nextUp) return
    ensureModuleOpen(nextUp.moduleId)
    // Jump straight into the next lesson (video opens the modal, download
    // opens the URL in a new tab).
    openLesson(nextUp)
  }

  // Core completion logic shared by the curriculum checklist and the video
  // modal. Optimistic tick -> server POST -> reconcile via refetch; rolls the
  // optimistic tick back on failure.
  const completeLessonCore = async (lessonId) => {
    if (completedIds.has(lessonId)) return false
    setError(null)
    setCompletingId(lessonId)
    setPendingComplete((prev) => new Set(prev).add(lessonId))
    try {
      await api.post(`/enrollments/${enrollment.id}/lessons/${lessonId}/complete`)
      await loadEnrollment()
      return true
    } catch (err) {
      setPendingComplete((prev) => {
        const n = new Set(prev)
        n.delete(lessonId)
        return n
      })
      setError(
        err.response?.data?.error ||
          'Failed to mark lesson complete. Please try again.'
      )
      return false
    } finally {
      setCompletingId(null)
    }
  }

  const handleToggleComplete = async (lessonId) => {
    const willFinish = totalLessons > 0 && completedCount + 1 >= totalLessons
    const ok = await completeLessonCore(lessonId)
    if (ok && willFinish) setTimeout(celebrateOnce, 600)
  }

  const openLesson = (lesson) => {
    if (lesson.type === 'video') {
      // Store the whole lesson (id/title/url/content) — the modal needs all of
      // it plus the parent completes via id on finish.
      setActiveLesson(lesson)
    } else {
      window.open(lesson.url, '_blank', 'noopener,noreferrer')
    }
  }

  /**
   * Invoked by the video modal when playback ends (YouTube API) or when the
   * student presses "Complete & continue". Completes the lesson and tells the
   * modal what to do next:
   *   - end=true        -> final lesson; modal closes, confetti fires here.
   *   - next={fields}   -> modal swaps itself to the following lesson.
   */
  const handleWatchFinished = async () => {
    const lesson = activeLesson
    if (!lesson || completedIds.has(lesson.id)) return { ok: false }

    const isEnd =
      flatLessons.filter(
        (l) => l.id !== lesson.id && !completedIds.has(l.id)
      ).length === 0

    const ok = await completeLessonCore(lesson.id)
    if (!ok) return { ok: false }

    if (isEnd) {
      celebrateOnce()
      return { ok: true, next: null, end: true }
    }

    const doneSet = new Set([...completedIds, lesson.id])
    const next =
      flatLessons.find((l) => l.id !== lesson.id && !doneSet.has(l.id)) || null
    return {
      ok: true,
      end: false,
      next: next
        ? { title: next.title, url: next.url, content: next.content, done: false }
        : null,
    }
  }

  // Running order number across all modules (used while rendering rows).
  let runningIndex = 0

  // Shared curriculum renderer: the module accordions with lesson rows. Used
  // by both the in-progress view and the completed (review) view. For a
  // completed course every lesson/module is unlocked, so students can reopen
  // any lesson to re-watch it.
  const renderCurriculum = () => (
    <div className="min-w-0 flex-1">
      <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 lesson-panel">
        <div className="card-top flex justify-between items-center gap-4 mb-4">
          <div className="info-block">
            <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1">Course content</p>
            <h3 className="m-0">
              {status === 'completed' ? 'Review course' : 'Curriculum'}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(143,170,205,0.18)] bg-[rgba(148,175,211,0.12)] px-2.5 py-1 text-xs font-medium text-muted">
            {completedCount}/{totalLessons} done
          </span>
        </div>

        {flatLessons.length === 0 && (
          <p className="text-sm text-muted m-0 py-4 text-center">
            No lessons have been added to this course yet. Check back soon.
          </p>
        )}

        {modulesList.map((module) => {
          const modLessons = module.lessons || []
          const modDone = modLessons.filter((l) => completedIds.has(l.id)).length
          const modPct = modLessons.length
            ? Math.round((modDone / modLessons.length) * 100)
            : 0
          // A module is unlocked when one of its lessons is either
          // completed or is the current "next up" lesson. Practically
          // this unlocks the first module for a fresh enrollment and the
          // following module once its predecessor's lessons are done.
          const modUnlocked = modLessons.some((l) => isLessonUnlocked(l))
          const isOpen = modUnlocked && !!expandedModules[module.id]
          return (
            <div key={module.id} className="mb-3 last:mb-0 rounded-xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.45)] overflow-hidden">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`module-body-${module.id}`}
                disabled={!modUnlocked}
                onClick={() => {
                  if (modUnlocked) toggleModule(module.id)
                }}
                title={
                  modUnlocked
                    ? ''
                    : 'Locked — complete the previous module first'
                }
                className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer bg-transparent border-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-default/50 ${
                  modUnlocked ? '' : 'cursor-not-allowed opacity-70'
                }`}
              >
<svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                >
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>

                <span className={`flex-1 min-w-0 truncate text-sm font-bold uppercase tracking-wide ${modUnlocked ? 'text-cyan-default' : 'text-muted'}`}>
                  {module.title}
                </span>
                {!modUnlocked && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-muted" aria-hidden="true">
                    🔒 Locked
                  </span>
                )}
                {modLessons.length > 0 && (
                  <span className="hidden sm:block w-24 h-1.5 rounded-full bg-[rgba(15,27,40,0.9)] overflow-hidden shrink-0" aria-hidden="true">
                    <span className="block h-full rounded-full bg-gradient-to-r from-cyan-default to-green-default transition-all duration-300" style={{ width: `${modPct}%` }} />
                  </span>
                )}
                <span className="text-xs font-semibold text-muted shrink-0 tabular-nums">
                  {modDone}/{modLessons.length}
                </span>
              </button>

              {isOpen && (
                <div id={`module-body-${module.id}`} className="px-3 pb-3 pt-1 flex flex-col gap-2">
                  {modLessons.length === 0 && (
                    <p className="text-sm text-muted m-0 py-2 text-center">No lessons in this module yet.</p>
                  )}

                  {modLessons.map((lesson) => {
                    runningIndex += 1
                    const idx = runningIndex
                    const isDone = completedIds.has(lesson.id)
                    const busy = completingId === lesson.id && !isDone
                    const locked = !isLessonUnlocked(lesson)
                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                          isDone
                            ? 'border-green-default/20 bg-[rgba(45,212,167,0.05)]'
                            : locked
                              ? 'border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.5)] opacity-60'
                              : 'border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.5)] hover:border-cyan-default/40'
                        }`}
                      >
                        <CheckCircle
                          completed={isDone}
                          busy={busy}
                          disabled={locked}
                          label={`${isDone ? 'Completed' : 'Mark complete'}: ${lesson.title}`}
                          onClick={() => handleToggleComplete(lesson.id)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!locked) openLesson(lesson)
                          }}
                          disabled={locked}
                          title={locked ? 'Locked — complete the previous lesson first' : undefined}
                          className={`flex min-w-0 flex-1 items-center gap-2.5 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-default/50 ${locked ? 'cursor-not-allowed bg-transparent border-0 p-0' : 'cursor-pointer bg-transparent border-0 p-0'}`}
                        >
                          <span className={`shrink-0 grid place-items-center h-5 w-5 rounded-md text-[10px] font-bold text-muted tabular-nums ${locked ? 'bg-[rgba(148,175,211,0.08)]' : 'bg-[rgba(148,175,211,0.12)]'}`} aria-hidden="true">
                            {locked ? '🔒' : idx}
                          </span>
                          <span className={`min-w-0 truncate text-sm font-medium ${isDone ? 'text-muted line-through decoration-green-default/40' : locked ? 'text-muted' : 'text-white'}`}>
                            {lesson.title}
                          </span>
                          <span className="hidden md:inline shrink-0 text-[11px] font-medium text-muted border border-[rgba(143,170,205,0.18)] rounded-md px-1.5 py-0.5">
                            {lesson.type === 'video' ? '▶ Video' : '⬇ Download'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!locked) openLesson(lesson)
                          }}
                          disabled={locked}
                          className={`btn btn-secondary shrink-0 inline-flex items-center justify-center gap-1.5 font-semibold text-sm transition-all duration-200 ${
                            locked
                              ? 'cursor-not-allowed opacity-70'
                              : 'cursor-pointer'
                          }`}
                        >
                          {locked ? '🔒 Locked' : lesson.type === 'video' ? 'Watch' : 'Get'}
                        </button>
                      </div>
                    )
                  })}
                  </div>
                )}
              </div>
          )
        })}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <PageHeader eyebrow="Learning progress" title="My Enrollment" className="mb-6" />
        <SkeletonRows rows={5} />
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="content-page max-w-[1200px] mx-auto w-full p-6">
        <PageHeader eyebrow="Learning progress" title="My Enrollment" className="mb-6" />

        <div className="section-shell rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5 mb-6 empty-state text-center py-10">
          <p>You don't have an active enrollment yet.</p>
          <Button renderAs={Link} to="/student/browse" className="mt-3">
            Browse Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page max-w-[1200px] mx-auto w-full p-6">
      <ConfettiBurst show={showConfetti} />
      {activeLesson && (
        <VideoModal
          title={activeLesson.title}
          url={activeLesson.url}
          content={activeLesson.content}
          isDone={completedIds.has(activeLesson.id)}
          onRequestFinish={handleWatchFinished}
          onClose={() => setActiveLesson(null)}
        />
      )}

      <PageHeader eyebrow="Learning progress" title="My Enrollment" className="mb-6" />

      {error && <Alert tone="error" className="mb-6">{error}</Alert>}

      {statusNotice === 'approved' && (
        <div className="section-shell rounded-2xl border border-green-default/30 bg-[rgba(45,212,167,0.08)] p-5 mb-6 flex items-start justify-between gap-4 flex-wrap success-panel">
          <p className="m-0 text-sm">
            ✅ Your enrollment in{' '}
            <span className="font-semibold">{course?.title || 'the course'}</span> was
            approved! Your lessons are ready{status === 'in_progress' ? ' below' : ''}.
          </p>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted hover:text-cyan-default hover:border-cyan-default/40 transition-colors px-4 py-2 rounded-xl text-sm cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
      {statusNotice === 'rejected' && (
        <div className="section-shell rounded-2xl border border-red-500/30 bg-[rgba(239,68,68,0.08)] p-5 mb-6 flex items-start justify-between gap-4 flex-wrap error-panel">
          <p className="m-0 text-sm">
            ❌ Your enrollment request was rejected
            {enrollment.reason ? (
              <>
                {' '}— reason: <span className="font-semibold">{enrollment.reason}</span>
              </>
            ) : null}
            . You can request a different course.
          </p>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted hover:text-cyan-default hover:border-cyan-default/40 transition-colors px-4 py-2 rounded-xl text-sm cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --------------------------- REJECTED --------------------------- */}
      {status === 'rejected' && (
        <div className="section-shell rounded-2xl border border-red-500/30 bg-[rgba(239,68,68,0.08)] p-5 mb-6 error-panel">
          <div className="card-top flex justify-between items-start gap-4">
            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Enrollment rejected</span>
              <h3>{course.title}</h3>
            </div>
            <StatusChip status="rejected" />
          </div>
          {enrollment.reason && (
            <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0 mt-2">
              Reason: {enrollment.reason}
            </p>
          )}
          <div className="button-row flex flex-wrap items-center gap-2.5 mt-3">
            <Button renderAs={Link} to="/student/browse">Browse Courses</Button>
          </div>
        </div>
      )}

      {/* --------------------------- PENDING ---------------------------- */}
      {status === 'pending' && (
        <div className="section-shell rounded-2xl border border-cyan-default/30 bg-[rgba(56,215,255,0.06)] p-5 mb-6 notice-panel">
          <div className="card-top flex justify-between items-start gap-4">
            <div className="info-block flex flex-col gap-1">
              <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Waiting for approval</span>
              <h3>{course.title}</h3>
            </div>
            <StatusChip status="pending" />
          </div>
          <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0">
            Your enrollment request is under review. We’ll update your access as soon as an admin approves it.
          </p>
        </div>
      )}

      {/* -------------------------- COMPLETED --------------------------- */}
      {status === 'completed' && (
        <div className="flex flex-col gap-6">
          <div className="section-shell rounded-2xl border border-green-default/30 bg-[rgba(45,212,167,0.08)] p-5 success-panel">
            <div className="card-top flex justify-between items-start gap-4">
              <div className="info-block flex flex-col gap-1">
                <span className="muted-label text-xs font-semibold text-muted uppercase tracking-wider">Course completed</span>
                <h3>{course.title}</h3>
              </div>
              <StatusChip status="completed" />
            </div>
            <p className="post-body text-sm leading-relaxed whitespace-pre-wrap m-0">🎉 Congratulations — you finished every lesson!</p>
            <div className="button-row flex flex-wrap items-center gap-2.5 mt-2">
              <Button renderAs={Link} to="/student/browse">Explore more courses</Button>
            </div>
          </div>

          {/* Revisit the finished course: every lesson is unlocked so the
              student can re-watch any video / re-read any notes. */}
          {renderCurriculum()}
        </div>
      )}

      {/* ------------------------- IN PROGRESS -------------------------- */}
      {status === 'in_progress' && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ---- Sticky course rail ---- */}
          <aside className="w-full shrink-0 self-start lg:sticky lg:top-24 lg:w-[320px]">
            <article className="rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.9)] p-5 flex flex-col gap-4 hover:border-cyan-default/30 transition-colors duration-200">
              <div className="card-top flex justify-between items-start gap-4">
                <div className="info-block flex flex-col gap-1 min-w-0">
                  <p className="eyebrow text-xs font-semibold text-cyan-default uppercase tracking-[0.16em] m-0 mb-1">Active course</p>
                  <h3 className="m-0 leading-snug break-words">{course.title}</h3>
                </div>
                <StatusChip status="in_progress" />
              </div>

              {course.description && (
                <p className="text-sm text-muted leading-relaxed m-0">{course.description}</p>
              )}

              <div className="flex items-center gap-4">
                <ProgressBarRing percentage={percentage} size={112} />
                <div className="info-block flex flex-col gap-1 min-w-0">
                  <span className="text-lg font-bold text-white">
                    {completedCount} <span className="text-muted font-medium">of {totalLessons}</span>
                  </span>
                  <span className="text-xs text-muted">lessons completed</span>
                </div>
              </div>

              <div className="progress-track h-2 rounded-full bg-[rgba(15,27,40,0.8)] overflow-hidden">
                <div
                  className="progress-bar h-full rounded-full bg-gradient-to-r from-cyan-default to-green-default transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {nextUp ? (
                <div className="rounded-xl border border-cyan-default/25 bg-[rgba(56,215,255,0.06)] p-3.5">
                  <p className="m-0 mb-1 text-xs font-semibold text-cyan-default uppercase tracking-wider">Next up</p>
                  <p className="m-0 mb-3 text-sm font-medium truncate">{nextUp.title}</p>
                  <Button onClick={continueLearning} className="w-full">
                    ▶ Continue learning
                  </Button>
                </div>
              ) : (
                totalLessons > 0 && (
                  <div className="rounded-xl border border-green-default/25 bg-[rgba(45,212,167,0.06)] p-3.5 text-sm text-green-default font-semibold">
                    🎉 All lessons done — nicely!
                  </div>
                )
              )}
            </article>
          </aside>

          {/* ---- Curriculum accordions ---- */}
          {renderCurriculum()}
          </div>
      )}
    </div>
  )
}

export default MyEnrollment
