import { useCallback, useEffect, useState } from 'react'

export default function useApiData(loader, dependencies = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    loader()
      .then((result) => { if (active) setData(result) })
      .catch((cause) => { if (active) setError(cause.message || 'An unexpected error occurred.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey, ...dependencies])

  return { data, loading, error, reload }
}
