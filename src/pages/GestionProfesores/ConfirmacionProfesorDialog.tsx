import { useEffect, useRef } from 'react'

export interface ConfirmacionProfesorCopy {
  title: string
  description: string
  name: string
  label: string
  busyLabel: string
  danger: boolean
}

interface ConfirmacionProfesorDialogProps {
  copy: ConfirmacionProfesorCopy
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const ConfirmacionProfesorDialog = ({ copy, busy, onCancel, onConfirm }: ConfirmacionProfesorDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onCancel])

  return (
    <div className="gestion-profesores__confirmation" role="dialog" aria-modal="true" aria-labelledby="gestion-profesores-confirmation-title" aria-describedby="gestion-profesores-confirmation-description">
      <button className="gestion-profesores__confirmation-backdrop" type="button" aria-label="Cancelar acción" disabled={busy} onClick={onCancel} />
      <section className="gestion-profesores__confirmation-dialog">
        <button className="gestion-profesores__confirmation-close" type="button" aria-label="Cerrar" disabled={busy} onClick={onCancel}>×</button>
        <div className={`gestion-profesores__confirmation-icon${copy.danger ? ' gestion-profesores__confirmation-icon--danger' : ''}`} aria-hidden="true">!</div>
        <div className="gestion-profesores__confirmation-content">
          <h2 id="gestion-profesores-confirmation-title">{copy.title}</h2>
          <p id="gestion-profesores-confirmation-description">{copy.description}</p>
          <dl><div><dt>Profesor</dt><dd>{copy.name}</dd></div></dl>
        </div>
        <div className="gestion-profesores__confirmation-actions">
          <button ref={cancelRef} type="button" className="gestion-profesores__confirmation-cancel" disabled={busy} onClick={onCancel}>Cancelar</button>
          <button type="button" className={copy.danger ? 'gestion-profesores__confirmation-confirm gestion-profesores__confirmation-confirm--danger' : 'gestion-profesores__confirmation-confirm'} disabled={busy} onClick={onConfirm}>{busy ? copy.busyLabel : copy.label}</button>
        </div>
      </section>
    </div>
  )
}
