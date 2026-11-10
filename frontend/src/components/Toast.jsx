import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export function useNotice() {
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  return { notice, setNotice }
}

export default function Toast({ notice, onClose }) {
  if (!notice) return null
  const isError = notice.type === 'error'
  const Icon = isError ? AlertCircle : CheckCircle2
  return (
    <div className={`toast toast-${isError ? 'error' : 'success'}`} role="status">
      <Icon size={19} />
      <span>{notice.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><X size={17} /></button>
    </div>
  )
}
