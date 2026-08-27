/** Shimmer placeholder shown while the enrollment loads. */
export default function SkeletonRows({ rows = 4 }) {
  return (
    <div
      className="section-shell mb-6 rounded-2xl border border-[rgba(143,170,205,0.12)] bg-[rgba(13,22,35,0.8)] p-5"
      aria-busy="true"
      role="status"
    >
      <p className="sr-only">Loading your enrollment…</p>
      <div className="mb-5 h-4 w-48 animate-pulse rounded bg-[rgba(148,175,211,0.15)]" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-[rgba(143,170,205,0.08)] bg-[rgba(9,17,27,0.5)] px-4 py-3"
          >
            <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-[rgba(148,175,211,0.12)]" />
            <div
              className="h-3 animate-pulse rounded bg-[rgba(148,175,211,0.12)]"
              style={{ width: `${55 + ((i * 17) % 30)}%` }}
            />
            <div className="ml-auto h-8 w-16 animate-pulse rounded-lg bg-[rgba(148,175,211,0.08)]" />
          </div>
        ))
      }
      </div>
    </div>
  )
}
