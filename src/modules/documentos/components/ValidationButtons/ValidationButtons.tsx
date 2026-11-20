import type { DocumentoValidacionEstado } from '../../types/ui'
import './ValidationButtons.css'

interface ValidationButtonsProps {
  estadoUi: DocumentoValidacionEstado
  disabled: boolean
  onApprove: () => void
  /** Si se envía, tras aprobar o rechazar aparece un enlace discreto "Deshacer" para corregir una decisión equivocada. */
  onUndo?: () => void
  undoDisabled?: boolean
  onRejectStart: () => void
  isRejectMode: boolean
  onRejectCancel: () => void
  onRejectConfirm: (note: string) => void
  rejectNote: string
  setRejectNote: (note: string) => void
  rejectError?: string | null
  textareaId?: string
}

const ValidationButtons = ({
  estadoUi,
  disabled,
  onApprove,
  onUndo,
  undoDisabled = false,
  onRejectStart,
  isRejectMode,
  onRejectCancel,
  onRejectConfirm,
  rejectNote,
  setRejectNote,
  rejectError,
  textareaId = "reject-note",
}: ValidationButtonsProps) => {
  const isApproveActive = estadoUi === 'APROBADO'
  const isRejectActive = estadoUi === 'RECHAZADO'
  const canUndo = Boolean(onUndo) && (isApproveActive || isRejectActive)

  return (
    <div className="validation-buttons">
      <div className="validation-buttons__row">
        <button
          type="button"
          className={`validation-buttons__btn validation-buttons__btn--approve ${
            isApproveActive ? 'validation-buttons__btn--active' : ''
          }`}
          onClick={onApprove}
          disabled={disabled}
          aria-disabled={disabled}
        >
          Aprobar
        </button>
        <button
          type="button"
          className={`validation-buttons__btn validation-buttons__btn--reject ${
            isRejectActive ? 'validation-buttons__btn--active' : ''
          }`}
          onClick={onRejectStart}
          disabled={disabled}
          aria-disabled={disabled}
        >
          Rechazar
        </button>
      </div>

      {canUndo ? (
        <button
          type="button"
          className="validation-buttons__undo"
          onClick={onUndo}
          disabled={undoDisabled}
          title="Devolver el documento a por revisar para decidir de nuevo"
        >
          Deshacer
        </button>
      ) : null}

      {isRejectMode ? (
        <div className="validation-buttons__reject-mode">
          <label className="validation-buttons__label" htmlFor={textareaId}>
            Motivo del rechazo
          </label>
          <textarea
            id={textareaId}
            className="validation-buttons__textarea"
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
            rows={3}
          />
          {rejectError ? <span className="validation-buttons__error">{rejectError}</span> : null}
          <div className="validation-buttons__row">
            <button
              type="button"
              className="validation-buttons__btn validation-buttons__btn--neutral"
              onClick={onRejectCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="validation-buttons__btn validation-buttons__btn--reject validation-buttons__btn--active"
              onClick={() => onRejectConfirm(rejectNote)}
            >
              Confirmar rechazo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ValidationButtons
