import { CheckCircle2, Clock3, XCircle, CircleDashed } from 'lucide-react'

const statusClass = {
  SUCCESS: 'success',
  APPROVED: 'success',
  PASSED: 'success',
  FAILED: 'danger',
  REJECTED: 'danger',
  PENDING: 'pending',
  SKIPPED: 'neutral',
  STAGING: 'info',
  PRODUCTION: 'purple',
}

const statusIcon = {
  SUCCESS: CheckCircle2,
  APPROVED: CheckCircle2,
  PASSED: CheckCircle2,
  FAILED: XCircle,
  REJECTED: XCircle,
  PENDING: Clock3,
}

export default function StatusBadge({ value }) {
  const label = value ? value.toLowerCase().replaceAll('_', ' ') : 'unknown'
  const Icon = statusIcon[value] || CircleDashed
  return (
    <span className={`status-badge status-${statusClass[value] || 'neutral'}`}>
      <Icon size={14} strokeWidth={2.2} />
      {label}
    </span>
  )
}
