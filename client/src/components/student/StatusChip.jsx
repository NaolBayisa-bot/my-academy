/** Shared enrollment-status pill. Replaces copy-pasted chip class strings. */
const VARIANTS = {
  pending:
    'bg-[rgba(148,175,211,0.12)] border-[rgba(143,170,205,0.18)] text-muted',
  in_progress:
    'bg-green-soft border border-green-default/25 text-green-default',
  completed:
    'bg-green-soft border border-green-default/25 text-green-default',
  rejected: 'bg-red-500/10 border border-red-500/30 text-red-300',
}

const LABELS = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

export default function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        VARIANTS[status] || VARIANTS.pending
      }`}
    >
      {LABELS[status] || status}
    </span>
  )
}
