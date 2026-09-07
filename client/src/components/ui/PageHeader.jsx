// Standard page header: eyebrow + title + optional subtitle and right-side
// CTA. Consolidates the repeated header markup across all pages.
//
//   <PageHeader eyebrow="Category overview" title="Your category"
//                subtitle="12 students · 3 courses" action={<Link .../>} />
export default function PageHeader({ eyebrow, title, subtitle, action, className = '' }) {
  return (
    <div className={`page-header flex items-start justify-between gap-4 flex-wrap ${className}`.trim()}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title text-2xl md:text-3xl">{title}</h1>
        {subtitle && <p className="page-subtitle m-0">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}