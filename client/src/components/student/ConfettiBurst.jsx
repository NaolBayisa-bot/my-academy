import { useMemo } from 'react'
import './animations.css'

const COLORS = ['#38d7ff', '#15c3f2', '#2dd4a7', '#7dd8ff', '#ffd166', '#ef476f']
const COUNT = 28

/**
 * Lightweight confetti overlay (no external dependency). Pieces fall with an
 * infinite CSS animation; the parent controls how long `show` stays true.
 */
export default function ConfettiBurst({ show }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 600,
        duration: 2600 + Math.random() * 1800,
        color: COLORS[i % COLORS.length],
      })),
    [] // generate once per mount
  )

  if (!show) return null
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}ms linear ${p.delay}ms infinite`,
          }}
        />
      ))}
    </div>
  )
}
