import { useEffect, useRef, useState } from 'react'

const clamp = (v) => Math.max(0, Math.min(100, v))

/**
 * Circular progress ring with a count-up percentage readout.
 * Uses the app palette: cyan #38d7ff → green #2dd4a7 gradient.
 */
export default function ProgressBarRing({ percentage = 0, size = 128 }) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const [display, setDisplay] = useState(clamp(Math.round(percentage)))
  const prevRef = useRef(clamp(Math.round(percentage)))

  useEffect(() => {
    const from = prevRef.current
    const to = clamp(Math.round(percentage))
    if (from === to) return undefined
    const duration = 700
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        prevRef.current = to
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [percentage])

  const offset = circumference - (display / 100) * circumference

  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${display} percent of the course is complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(15, 27, 40, 0.9)"
          strokeWidth={stroke}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38d7ff" />
            <stop offset="100%" stopColor="#2dd4a7" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-xl font-black text-white">{display}%</span>
    </div>
  )
}
