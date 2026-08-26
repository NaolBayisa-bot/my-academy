import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../api/axios'

// localStorage key holding the set of course IDs the student has already seen.
const SEEN_KEY = 'seenCourseIds'

const readSeenIds = () => {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? new Set(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

const writeSeenIds = (idSet) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...idSet]))
  } catch {
    /* storage unavailable — alerts just won't persist across sessions */
  }
}

const POLL_INTERVAL_MS = 30_000

// Shared hook for the student's category courses with new-course detection.
//
//  - Fetches GET /students/my-category-courses on mount, on window focus,
//    and on a 30s poll so newly created (admin) courses appear without a
//    manual page reload.
//  - Diffs course IDs against the "seen" set persisted in localStorage.
//    Course IDs not yet seen are exposed via `newCourseIds` so callers can
//    render a notification banner. The very first fetch seeds the seen set
//    silently, so pre-existing courses never trigger a false alert.
export function useCategoryCourses(enabled) {
  const [courses, setCourses] = useState([])
  const [newCourseIds, setNewCourseIds] = useState([])
  const [fetchError, setFetchError] = useState(null)
  const seenRef = useRef(readSeenIds())

  const load = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await api.get('/students/my-category-courses')
      const next = res.data.courses || []

      // First-ever visit: seed the seen set without raising alerts.
      if (!seenRef.current) {
        seenRef.current = new Set(next.map((c) => c.id))
        writeSeenIds(seenRef.current)
      } else {
        const unseen = next
          .filter((c) => !seenRef.current.has(c.id))
          .map((c) => c.id)
        if (unseen.length > 0) {
          setNewCourseIds((prev) => [...new Set([...prev, ...unseen])])
        }
      }

      setCourses(next)
      setFetchError(null)
    } catch (err) {
      setFetchError(
        err.response?.data?.error ||
          'Failed to load courses. Please try again.'
      )
    }
  }, [enabled])

  // Initial load + poll while mounted.
  useEffect(() => {
    if (!enabled) return
    load()
    const intervalId = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [enabled, load])

  // Instant refresh when the student returns to the tab.
  useEffect(() => {
    if (!enabled) return
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [enabled, load])

  // Dismiss the notification and persist the current course IDs as seen.
  const markAllSeen = useCallback(() => {
    setNewCourseIds([])
    seenRef.current = new Set(courses.map((c) => c.id))
    writeSeenIds(seenRef.current)
  }, [courses])

  return { courses, newCourseIds, fetchError, reload: load, markAllSeen }
}
