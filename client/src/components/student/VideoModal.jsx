import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Convert common video host URLs to embeddable player URLs so students can
 * watch without leaving the platform. Returns null when the URL cannot be
 * safely embedded (caller then offers an external-tab fallback).
 */
function toEmbedUrl(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') {
        const v = u.searchParams.get('v')
        return v ? `https://www.youtube.com/embed/${v}` : null
      }
      const shorts = u.pathname.match(/^\/shorts\/([^/]+)/)
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`
      return null
    }
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    if (host === 'vimeo.com' && /^\/\d+/.test(u.pathname)) {
      return `https://player.vimeo.com/video${u.pathname}`
    }
    return null
  } catch {
    return null
  }
}

/**
 * Lightweight in-app lesson modal. Closes on Escape or backdrop click,
 * locks body scroll while open, and focuses its close button on mount.
 */
export default function VideoModal({ url, title, onClose }) {
  const closeRef = useRef(null)
  const embedUrl = useMemo(() => toEmbedUrl(url), [url])

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

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Lesson video: ${title || ''}`}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-[rgba(143,170,205,0.18)] bg-[rgba(13,22,35,0.97)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="truncate text-base font-bold text-white m-0">{title}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-[rgba(143,170,205,0.18)] bg-[rgba(15,27,40,0.8)] text-muted transition-colors hover:border-cyan-default/50 hover:text-cyan-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-default/60"
          >
            ✕
          </button>
        </div>

        {embedUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={embedUrl}
              title={title || 'Lesson video'}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-xl border border-[rgba(143,170,205,0.12)] bg-[rgba(9,17,27,0.6)] p-6 text-center">
            <p className="m-0 mb-3 text-sm text-muted">
              This video can’t be embedded here — open it in a new tab instead.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-btn inline-flex items-center justify-center no-underline bg-gradient-to-r from-cyan-default to-cyan-strong text-[#031320] font-bold px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(13,190,255,0.22)] hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            >
              Open in new tab ↗
            </a>
          </div>
        )}

        <p className="mt-3 m-0 text-center text-xs text-muted">
          Done watching? Close this and tick the circle next to the lesson.
        </p>
      </div>
    </div>,
    document.body
  )
}
