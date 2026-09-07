// Skeleton shimmer block. Extract the copy-pasted `SkeletonBlock` used across
// every dashboard page. `className` controls the size/shape (e.g. "h-4 w-32").
export default function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-line animate-shimmer ${className}`.trim()} />
}