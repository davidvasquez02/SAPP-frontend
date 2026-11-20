import { useEffect, useRef, useState } from 'react'
import type { DocenteEvaluadorOption, EvaluadorConvocatoriaDto } from '../../api/convocatoriaAdmisionTypes'
import './EvaluadoresConvocatoriaDialog.css'

/** Gestión de los miembros del comité: solo se ofrece mientras la evaluación no se haya iniciado. */
export interface EvaluadoresManagement {
  /** false cuando la evaluación ya se inició: solo se muestra el aviso. */
  editable: boolean
  candidatos: DocenteEvaluadorOption[]
  candidatosLoading: boolean
  candidatosError: string | null
  busy: boolean
  actionError: string | null
  onAdd: (uuid: string) => void
  onRemove: (asignacionId: number) => void
}

interface EvaluadoresConvocatoriaDialogProps {
  open: boolean
  evaluadores: EvaluadorConvocatoriaDto[]
  loading: boolean
  error: string | null
  onClose: () => void
  onRetry: () => void
  management?: EvaluadoresManagement
}

const EvaluadoresConvocatoriaDialog = ({
  open,
  evaluadores,
  loading,
  error,
  onClose,
  onRetry,
  management,
}: EvaluadoresConvocatoriaDialogProps) => {
  const [selectedUuid, setSelectedUuid] = useState('')
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
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

  const canEdit = management?.editable === true
  // Se ofrecen los docentes que todavía no están en el comité (el servidor también rechaza duplicados).
  const nombresAsignados = new Set(evaluadores.map((evaluador) => evaluador.evaluador.trim()))
  const disponibles = (management?.candidatos ?? []).filter((docente) => !nombresAsignados.has(docente.nombre))

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
              {management
                ? 'Miembros del comité que evalúan esta convocatoria. El coordinador y el director de escuela son fijos.'
                : 'Consulta las personas asignadas para evaluar esta convocatoria.'}
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
                    <div className="evaluadores-convocatoria-dialog__person">
                      <strong>{evaluador.evaluador.trim() || 'Nombre no disponible'}</strong>
                      <span>{evaluador.programa || 'Programa no disponible'}</span>
                      {evaluador.fijo ? <em className="evaluadores-convocatoria-dialog__tag">Miembro fijo</em> : null}
                    </div>
                    {canEdit && !evaluador.fijo ? (
                      confirmingId === evaluador.id ? (
                        <div className="evaluadores-convocatoria-dialog__confirm" role="group" aria-label="Confirmar">
                          <button
                            type="button"
                            className="evaluadores-convocatoria-dialog__danger"
                            disabled={management?.busy}
                            onClick={() => {
                              setConfirmingId(null)
                              management?.onRemove(evaluador.id)
                            }}
                          >
                            Quitar
                          </button>
                          <button type="button" disabled={management?.busy} onClick={() => setConfirmingId(null)}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="evaluadores-convocatoria-dialog__remove"
                          disabled={management?.busy}
                          onClick={() => setConfirmingId(evaluador.id)}
                          aria-label={`Quitar a ${evaluador.evaluador.trim()}`}
                        >
                          Quitar
                        </button>
                      )
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {management && !management.editable ? (
            <p className="evaluadores-convocatoria-dialog__locked" role="note">
              La evaluación ya se inició para al menos un aspirante: los evaluadores ya no se pueden modificar.
            </p>
          ) : null}

          {canEdit ? (
            <form
              className="evaluadores-convocatoria-dialog__add"
              onSubmit={(event) => {
                event.preventDefault()
                if (!selectedUuid) return
                management?.onAdd(selectedUuid)
                setSelectedUuid('')
              }}
            >
              <label htmlFor="evaluadores-convocatoria-docente">Agregar docente al comité</label>
              <div className="evaluadores-convocatoria-dialog__add-row">
                <select
                  id="evaluadores-convocatoria-docente"
                  value={selectedUuid}
                  disabled={management?.busy || management?.candidatosLoading}
                  onChange={(event) => setSelectedUuid(event.target.value)}
                >
                  <option value="">
                    {management?.candidatosLoading ? 'Cargando docentes…' : 'Seleccione un docente'}
                  </option>
                  {disponibles.map((docente) => (
                    <option key={docente.uuid} value={docente.uuid}>
                      {docente.nombre}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={!selectedUuid || management?.busy}>
                  {management?.busy ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
              {management?.candidatosError ? (
                <p className="evaluadores-convocatoria-dialog__field-error" role="alert">{management.candidatosError}</p>
              ) : null}
            </form>
          ) : null}

          {management?.actionError ? (
            <p className="evaluadores-convocatoria-dialog__field-error" role="alert">{management.actionError}</p>
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
