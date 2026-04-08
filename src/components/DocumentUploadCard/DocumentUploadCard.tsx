import type { ChangeEvent } from 'react'
import type { DocumentUploadItem } from '../../modules/documentos/types/documentUploadTypes'
import { openBase64InNewTab } from '../../shared/files/base64FileUtils'
import './DocumentUploadCard.css'

interface DocumentUploadCardProps {
  item: DocumentUploadItem
  onSelectFile: (id: number, file: File | null) => void
  onUpload?: (id: number) => void
  onRemoveFile?: (id: number) => void
  disabled?: boolean
}

const STATUS_LABELS: Record<DocumentUploadItem['status'], string> = {
  NOT_SELECTED: 'Pendiente',
  READY_TO_UPLOAD: 'Archivo seleccionado',
  UPLOADING: 'Subiendo…',
  UPLOADED: 'En revisión',
  APPROVED: 'Aprobado ✅',
  REJECTED: 'Rechazado ❌',
  ERROR: 'Error ❌',
}

const getStatusLabel = (item: DocumentUploadItem): string => {
  if (item.status === 'READY_TO_UPLOAD' && item.selectedFile) {
    return item.selectedFile.name
  }

  return STATUS_LABELS[item.status]
}

const getUploadButtonLabel = (status: DocumentUploadItem['status']): string => {
  if (status === 'UPLOADING') {
    return 'Subiendo…'
  }

  if (status === 'UPLOADED' || status === 'APPROVED') {
    return 'Reemplazar / Subir de nuevo'
  }

  if (status === 'REJECTED') {
    return 'Subir nuevamente'
  }

  return 'Subir'
}

export const DocumentUploadCard = ({
  item,
  onSelectFile,
  onUpload,
  onRemoveFile,
  disabled = false,
}: DocumentUploadCardProps) => {
  const inputId = `document-upload-${item.id}`
  const statusClass = `document-upload-card__status document-upload-card__status--${item.status.toLowerCase()}`
  const uploadedFileName =
    item.status === 'UPLOADED' || item.status === 'APPROVED' || item.status === 'REJECTED'
      ? item.uploadedFileName
      : undefined
  const fileName = item.selectedFile?.name ?? uploadedFileName
  const canOpenUploadedFile =
    (item.status === 'UPLOADED' || item.status === 'APPROVED' || item.status === 'REJECTED') &&
    item.uploadedBase64 != null &&
    item.uploadedMimeType != null

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    onSelectFile(item.id, file)
  }

  return (
    <article className="document-upload-card">
      <header className="document-upload-card__header">
        <div>
          <h3 className="document-upload-card__title">{item.nombre}</h3>
        </div>
        <span
          className={
            item.obligatorio
              ? 'document-upload-card__badge document-upload-card__badge--required'
              : 'document-upload-card__badge document-upload-card__badge--optional'
          }
        >
          {item.obligatorio ? 'OBLIGATORIO' : 'OPCIONAL'}
        </span>
      </header>

      {item.descripcion ? (
        <p className="document-upload-card__description">{item.descripcion}</p>
      ) : null}

      <div className="document-upload-card__status-row">
        <span className={statusClass}>{getStatusLabel(item)}</span>
        {fileName ? (
          <span className="document-upload-card__filename">Archivo: {fileName}</span>
        ) : (
          <span className="document-upload-card__filename document-upload-card__filename--empty">
            Sin archivo seleccionado
          </span>
        )}
      </div>

      <div className="document-upload-card__actions">
        <label className="document-upload-card__file">
          <input
            id={inputId}
            type="file"
            onChange={handleChange}
            disabled={disabled}
          />
          <span>Seleccionar archivo</span>
        </label>
        {item.selectedFile && onRemoveFile ? (
          <button
            type="button"
            className="document-upload-card__button document-upload-card__button--ghost"
            onClick={() => onRemoveFile(item.id)}
            disabled={disabled}
          >
            Quitar archivo
          </button>
        ) : null}
        {onUpload ? (
          <button
            type="button"
            className="document-upload-card__button"
            onClick={() => onUpload(item.id)}
            disabled={disabled || !item.selectedFile || item.status === 'UPLOADING'}
          >
            {getUploadButtonLabel(item.status)}
          </button>
        ) : null}
        {canOpenUploadedFile ? (
          <button
            type="button"
            className="document-upload-card__button document-upload-card__button--ghost"
            onClick={() => openBase64InNewTab(item.uploadedBase64!, item.uploadedMimeType!, item.uploadedFileName)}
            disabled={disabled}
          >
            Ver documento
          </button>
        ) : null}
      </div>


      {item.status === 'REJECTED' && item.rejectionReason ? (
        <p className="document-upload-card__warning">Observación: {item.rejectionReason}</p>
      ) : null}

      {item.errorMessage ? (
        <p className="document-upload-card__error">{item.errorMessage}</p>
      ) : null}
    </article>
  )
}
