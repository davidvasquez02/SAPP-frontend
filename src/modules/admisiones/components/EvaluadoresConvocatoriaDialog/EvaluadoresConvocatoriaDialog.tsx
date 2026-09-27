import { useEffect, useRef } from 'react'
import type { EvaluadorConvocatoriaDto } from '../../api/convocatoriaAdmisionTypes'
import './EvaluadoresConvocatoriaDialog.css'

interface EvaluadoresConvocatoriaDialogProps {
  open: boolean
  evaluadores: EvaluadorConvocatoriaDto[]
  loading: boolean
  error: string | null
  onClose: () => void
  onRetry: () => void
}

const EvaluadoresConvocatoriaDialog = ({
  open,
  evaluadores,
  loading,
  error,
  onClose,
  onRetry,
}: EvaluadoresConvocatoriaDialogProps) => {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.requestAnimationFrame(() => previousFocusRef.current?.focus())
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="evaluadores-convocatoria-dialog__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="evaluadores-convocatoria-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evaluadores-convocatoria-title"
        aria-describedby="evaluadores-convocatoria-description"
      >
        <header className="evaluadores-convocatoria-dialog__header">
          <div>
            <p>Convocatoria de admisión</p>
            <h2 id="evaluadores-convocatoria-title">Evaluadores de la convocatoria</h2>
            <span id="evaluadores-convocatoria-description">
              Consulta las personas asignadas para evaluar esta convocatoria.
            </span>
          </div>
          <button type="button" aria-label="Cerrar" autoFocus onClick={onClose}>×</button>
        </header>

        <div className="evaluadores-convocatoria-dialog__content" aria-live="polite">
          {loading ? <p role="status">Consultando evaluadores…</p> : null}

          {!loading && error ? (
            <div className="evaluadores-convocatoria-dialog__error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={onRetry}>Reintentar</button>
            </div>
          ) : null}

          {!loading && !error && evaluadores.length === 0 ? (
            <p className="evaluadores-convocatoria-dialog__empty">
              No hay evaluadores registrados para esta convocatoria.
            </p>
          ) : null}

          {!loading && !error && evaluadores.length > 0 ? (
            <>
              <p className="evaluadores-convocatoria-dialog__count">
                {evaluadores.length} evaluador{evaluadores.length === 1 ? '' : 'es'} asignado{evaluadores.length === 1 ? '' : 's'}
              </p>
              <ul className="evaluadores-convocatoria-dialog__list">
                {evaluadores.map((evaluador) => (
                  <li key={evaluador.id}>
                    <strong>{evaluador.evaluador.trim() || 'Nombre no disponible'}</strong>
                    <span>{evaluador.programa || 'Programa no disponible'}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <footer>
          <button type="button" onClick={onClose}>Cerrar</button>
        </footer>
      </section>
    </div>
  )
}

export default EvaluadoresConvocatoriaDialog
