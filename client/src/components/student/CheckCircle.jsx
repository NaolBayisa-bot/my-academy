import './animations.css'

/**
 * Animated completion button for a lesson. Draws the checkmark when done,
 * shows a spinner while the request is in flight.
 */
export default function CheckCircle({ completed, busy = false, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={completed || busy}
      aria-pressed={completed}
      aria-label={label}
      title={completed ? 'Completed' : 'Mark as complete'}
      className={`relative grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-default/60 disabled:cursor-not-allowed ${
        completed
          ? 'border-green-default bg-green-soft'
          : 'border-[rgba(143,170,205,0.35)] bg-[rgba(9,17,27,0.6)] hover:border-cyan-default'
      } ${busy && !completed ? 'opacity-80' : ''}`}
    >
      {busy && !completed ? (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-default border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`h-4 w-4 ${completed ? 'text-green-default' : 'text-transparent'}`}
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={completed ? 'check-path' : ''}
          />
        </svg>
      )}
    </button>
  )
}
