import { AlertCircle, LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Loading data…' }) {
  return <div className="load-state"><LoaderCircle className="spin" size={22} /><span>{label}</span></div>
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={20} />
      <div><strong>We couldn’t load this data</strong><p>{message}</p></div>
      {onRetry && <button className="button button-secondary button-small" onClick={onRetry}>Try again</button>}
    </div>
  )
}
