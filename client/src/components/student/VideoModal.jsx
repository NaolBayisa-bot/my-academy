import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../ui'
import LessonContent from './LessonContent'

/**
 * Parse a lesson URL into playback info:
 *   { kind: 'yt', videoId }    → YouTube (Iframe API: auto-detect ENDED)
 *   { kind: 'embed', src }     → other embeddable iframe (Vimeo etc.) — manual finish
 *   null                       → cannot embed, external-tab fallback
 */
function parsePlayback(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      let id = null
      if (u.pathname === '/watch') id = u.searchParams.get('v')
      else if (/^\/shorts\/([^/]+)/.test(u.pathname)) {
        id = u.pathname.match(/^\/shorts\/([^/]+)/)[1]
      } else if (/^\/embed\/([^/?]+)/.test(u.pathname)) {
        id = u.pathname.match(/^\/embed\/([^/?]+)/)[1]
      }
      return id ? { kind: 'yt', videoId: id } : null
    }
    if (host === 'youtu.be' && /^\/[\w-]+/.test(u.pathname)) {
      return { kind: 'yt', videoId: u.pathname.slice(1) }
    }
    if (host === 'vimeo.com' && /^\/\d+/.test(u.pathname)) {
      return {
        kind: 'embed',
        src: `https://player.vimeo.com/video${u.pathname}?api=1`,
      }
    }
    return null
  } catch {
    return null
  }
}

let ytApiLoading = false // module-level: load the IFrame API once per session

/**
 * Lesson workspace modal.
 *
 * Contract with parent (MyEnrollment):
 *   onRequestFinish() -> Promise<
 *       { ok: true,  next: {...lessonFields} | null, end: boolean }
 *     | { ok: false }>                     'end' means course fully completed.
 * On success the modal either shows ✓ then swaps in the next lesson, or shows ✓
 * briefly and closes itself when the whole course is done. Closing the modal
 * via ESC/backdrop NEVER completes anything automatically.
 */
export default function VideoModal({
  title,
  url,
  content,
  isDone = false,
  onRequestFinish,
  onClose,
}) {
  const closeRef = useRef(null)
  const playerHostRef = useRef(null)
  const ytPlayerRef = useRef(null)
  const vimeoPlayerRef = useRef(null)
  const embedFrameRef = useRef(null)
  const videoStartedRef = useRef(false)

  const [view, setView] = useState({ title, url, content, done: isDone })
  const [phase, setPhase] = useState('idle') // idle | finishing | success
  // null = undetermined yet; true = YouTube API ready (auto-finish); false = manual
  const [autoDetect, setAutoDetect] = useState(null)
  // true once the current video has actually started playing (unlocks completion)
  const [videoStarted, setVideoStarted] = useState(false)

  const playback = useMemo(() => parsePlayback(view.url), [view.url])

  // Sync local view state whenever the parent opens a new lesson.
  useEffect(() => {
    setView({ title, url, content, done: isDone })
    setPhase('idle')
    setAutoDetect(null)
    setVideoStarted(false)
    videoStartedRef.current = false
    ytPlayerRef.current?.destroy?.()
    ytPlayerRef.current = null
  }, [title, url, content, isDone])

  // Escape key + body scroll lock + initial focus.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Teardown the YT player whenever the view URL or unmount changes.
  useEffect(
    () => () => {
      ytPlayerRef.current?.destroy?.()
      ytPlayerRef.current = null
    },
    []
  )

  // Completion stays locked until a real (embeddable) video has actually
  // started playing. Download / external-tab lessons have no video here, so
  // they are never gated.
  const isVideoLesson = !!playback
  const notStarted = isVideoLesson && !videoStarted && !view.done

  const finishFlow = async () => {
    if (phase !== 'idle' || !videoStartedRef.current) return
    setPhase('finishing')
    let result
    try {
      result = await onRequestFinish()
    } catch {
      result = { ok: false }
    }
    if (!result || !result.ok) {
      setPhase('idle') // parent already surfaced the error banner
      return
    }
    setPhase('success')
    setTimeout(() => {
      if (result.next) {
        setView({
          title: result.next.title,
          url: result.next.url,
          content: result.next.content,
          done: !!result.next.done,
        })
        setPhase('idle')
      } else {
        onClose()
      }
    }, 1400)
  }

  // ---- YouTube Iframe API bootstrap for the CURRENT video -----------------
  const videoId = playback && playback.kind === 'yt' ? playback.videoId : null

  useEffect(() => {
    if (!videoId) return undefined
    let disposed = false

    const build = () => {
      if (disposed || !window.YT || !playerHostRef.current) return
      try {
        ytPlayerRef.current = new window.YT.Player(playerHostRef.current, {
          videoId,
          playerVars: { rel: 0, modestbranding: 1 },
          events: {
            onReady: () => {
              if (!disposed) setAutoDetect(true)
            },
            onStateChange: (e) => {
              if (disposed) return
              if (e.data === window.YT.PlayerState.PLAYING) {
                videoStartedRef.current = true
                setVideoStarted(true)
                return
              }
              if (e.data === window.YT.PlayerState.ENDED) {
                finishFlow()
              }
            },
          },
        })
      } catch {
        if (!disposed) setAutoDetect(false)
      }
    }

    if (window.YT && window.YT.Player) {
      build()
    } else {
      const tag = document.getElementById('yt-iframe-api')
      if (!tag) {
        ytApiLoading = true
        const s = document.createElement('script')
        s.id = 'yt-iframe-api'
        s.src = 'https://www.youtube.com/iframe_api'
        const prevReady = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          prevReady?.()
          build()
        }
        document.body.appendChild(s)
      } else if (!ytApiLoading || window.YT) {
        build()
      } else {
        // script exists but still loading: poll briefly
        const t = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(t)
            build()
          }
        }, 250)
        setTimeout(() => clearInterval(t), 8000)
      }
      // Safety net: if the API never becomes ready (ad-blockers/offline),
      // fall back to the manual button.
      const failTimer = setTimeout(() => {
        if (!disposed) setAutoDetect((prev) => (prev === null ? false : prev))
      }, 7000)
      return () => {
        disposed = true
        clearTimeout(failTimer)
      }
    }
    const cleanup = () => {
      disposed = true
    }
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

// ---- Embeddable (non-YouTube) player bootstrap for the CURRENT video -----
  const embedSrc = playback && playback.kind === 'embed' ? playback.src : null

  useEffect(() => {
    if (!embedSrc) return undefined
    let disposed = false

    const build = () => {
      if (disposed || !window.Vimeo || !embedFrameRef.current) return
      try {
        const player = window.Vimeo.Player(embedFrameRef.current)
        vimeoPlayerRef.current = player
        player.on('play', () => {
          if (!disposed) {
            videoStartedRef.current = true
            setVideoStarted(true)
          }
        })
        player.on('ended', () => {
          if (!disposed) finishFlow()
        })
      } catch {
        // No event API (non-Vimeo embed): unlock so students aren't trapped.
        if (!disposed) {
          videoStartedRef.current = true
          setVideoStarted(true)
        }
      }
    }

    if (window.Vimeo && window.Vimeo.Player) {
      build()
    } else {
      const s = document.createElement('script')
      s.src = 'https://player.vimeo.com/api/player.js'
      s.onload = build
      document.body.appendChild(s)
      const failTimer = setTimeout(() => {
        if (!disposed) {
          videoStartedRef.current = true
          setVideoStarted(true)
        }
      }, 6000)
      return () => {
        disposed = true
        clearTimeout(failTimer)
        vimeoPlayerRef.current = null
      }
    }
    const cleanup = () => {
      disposed = true
    }
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedSrc])
  const hasNotes = !!(view.content && view.content.trim())

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 lg:p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Lesson: ${view.title || ''}`}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[min(94vw,1800px)] flex-col overflow-hidden rounded-2xl border border-[rgba(143,170,205,0.18)] bg-[rgba(13,22,35,0.97)] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2">
          <h3 className="m-0 truncate text-base font-bold text-white">{view.title}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close lesson"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted transition-colors hover:border-cyan-default/50 hover:text-cyan-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-default/60"
          >
            ✕
          </button>
        </div>

        {/* Body: stacked on small screens, side-by-side on >= lg */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:flex lg:gap-5 lg:overflow-hidden lg:px-5">
          {/* Video column */}
          <div className={hasNotes ? 'lg:w-[58%] lg:shrink-0' : 'w-full'}>
          {/* Video zone */}
          {playback && playback.kind === 'yt' && (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <div ref={playerHostRef} className="h-full w-full" />
            </div>
          )}
          {playback && playback.kind === 'embed' && (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                ref={embedFrameRef}
                src={playback.src}
                title={view.title || 'Lesson video'}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {!playback && (
            <div className="rounded-xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.6)] p-6 text-center">
              <p className="m-0 mb-3 text-sm text-muted">
                This video can’t be embedded here — open it in a new tab instead.
              </p>
              <Button renderAs="a" href={view.url} target="_blank" rel="noopener noreferrer">
                Open in new tab ↗
              </Button>
            </div>
          )}
          </div>

          {/* Notes / examples column */}
          {hasNotes ? (
            <section className="mt-4 shrink-0 rounded-xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.5)] p-4 lg:mt-0 lg:min-w-0 lg:flex-1 lg:self-stretch lg:overflow-y-auto lg:border-l-2 lg:border-l-cyan-default/15">
              <p className="eyebrow m-0 mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-default">
                📝 Lesson notes &amp; examples
              </p>
              <LessonContent content={view.content} />
            </section>
          ) : null}
        </div>

        {/* Sticky action row */}
        <div className="flex items-center justify-between gap-4 border-t border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.85)] px-4 py-3">
          <span className="text-xs text-muted">
            {phase === 'success'
              ? '✓ Completed!'
              : phase === 'finishing'
                ? 'Saving…'
                : notStarted
                  ? '▶ Start the video to enable completion'
                  : autoDetect === true
                    ? 'Auto-completes when the video ends'
                    : 'Finished watching? Mark it complete below.'}
          </span>
          {view.done ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-default/25 bg-green-soft px-3 py-1.5 text-xs font-semibold text-green-default">
              ✓ Completed
            </span>
          ) : (
            <Button
              type="button"
              onClick={() => {
                if (phase !== 'idle') return
                finishFlow()
              }}
              disabled={phase !== 'idle' || notStarted}
              title={notStarted ? 'Start the video to unlock completion' : undefined}
              className={notStarted ? 'blur-[2px]' : ''}
            >
              {phase === 'finishing' ? 'Saving…' : phase === 'success' ? '✓ Done' : '✓ Complete & continue'}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
