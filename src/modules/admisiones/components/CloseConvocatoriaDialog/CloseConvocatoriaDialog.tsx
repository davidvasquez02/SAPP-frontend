import { useEffect, useRef } from 'react'
import type { ConvocatoriaAdmisionDto } from '../../api/convocatoriaAdmisionTypes'
import './CloseConvocatoriaDialog.css'

interface CloseConvocatoriaDialogProps {
  convocatoria: ConvocatoriaAdmisionDto | null
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

const CloseConvocatoriaDialog = ({
  convocatoria,
  busy,
  onCancel,
  onConfirm,
}: CloseConvocatoriaDialogProps) => {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const busyRef = useRef(busy)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    busyRef.current = busy
    onCancelRef.current = onCancel
  }, [busy, onCancel])

  useEffect(() => {
    if (!convocatoria) return

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) onCancelRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.requestAnimationFrame(() => previousFocusRef.current?.focus())
    }
  }, [convocatoria])

  if (!convocatoria) return null

  return (
    <div
      className="close-convocatoria-dialog__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <section
        className="close-convocatoria-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-convocatoria-dialog-title"
        aria-describedby="close-convocatoria-dialog-description"
      >
        <div className="close-convocatoria-dialog__heading">
          <span className="close-convocatoria-dialog__mark" aria-hidden="true">!</span>
          <div>
            <h2 id="close-convocatoria-dialog-title">Cerrar convocatoria</h2>
            <p id="close-convocatoria-dialog-description">
              Vas a cerrar la convocatoria {convocatoria.periodo} de {convocatoria.programa}.
            </p>
          </div>
        </div>
        <p className="close-convocatoria-dialog__note">
          La convocatoria dejará de recibir nuevas inscripciones y aparecerá con estado cerrada.
        </p>
        <div className="close-convocatoria-dialog__actions">
          <button
            type="button"
            className="close-convocatoria-dialog__button close-convocatoria-dialog__button--secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="close-convocatoria-dialog__button close-convocatoria-dialog__button--primary"
            disabled={busy}
            autoFocus
            onClick={onConfirm}
          >
            {busy ? 'Cerrando…' : 'Cerrar convocatoria'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default CloseConvocatoriaDialog
