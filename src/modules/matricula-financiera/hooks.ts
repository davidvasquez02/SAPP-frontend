import { useCallback, useEffect, useRef, useState } from 'react'
import { LiquidacionApiError } from './api'

export const mensajeError = (error: unknown) => {
  if (error instanceof LiquidacionApiError) return [error.message, ...Object.entries(error.fields ?? {}).map(([key, value]) => `${key}: ${value}`)].join(' · ')
  return error instanceof Error ? error.message : 'No fue posible completar la operación.'
}
export function useConsulta<T>(fetcher: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true); setError('')
      try { const value = await fetcher(controller.signal); if (!controller.signal.aborted) setData(value) }
      catch (e) { if (!controller.signal.aborted) setError(mensajeError(e)) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [fetcher, revision])
  return { data, loading, error, refresh }
}
export function useOperacion() {
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const run = async (operation: () => Promise<void>, success = 'Cambios guardados.') => {
    if (locked.current) return false
    locked.current = true; setBusy(true); setError(''); setMessage('')
    try { await operation(); setMessage(success); return true }
    catch (e) { setError(mensajeError(e)); return false }
    finally { locked.current = false; setBusy(false) }
  }
  return { busy, error, message, run }
}
