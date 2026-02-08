import type { ChangeEvent } from 'react'
import type { DocumentUploadItem } from '../../modules/documentos/types/documentUploadTypes'
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
  READY_TO_UPLOAD: 'Listo para subir',
  UPLOADING: 'Subiendo…',
  UPLOADED: 'Cargado ✅',
  ERROR: 'Error ❌',
}

const getUploadButtonLabel = (status: DocumentUploadItem['status']): string => {
  if (status === 'UPLOADING') {
    return 'Subiendo…'
  }

  if (status === 'UPLOADED') {
    return 'Reemplazar / Subir de nuevo'
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
  const uploadedFileName = item.status === 'UPLOADED' ? item.uploadedFileName : undefined
  const fileName = item.selectedFile?.name ?? uploadedFileName

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    onSelectFile(item.id, file)
  }

  return (
    <article className="document-upload-card">
      <header className="document-upload-card__header">
        <div>
          <h3 className="document-upload-card__title">{item.nombre}</h3>
          <p className="document-upload-card__code">Código: {item.codigo}</p>
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
        <span className={statusClass}>{STATUS_LABELS[item.status]}</span>
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
      </div>

      {item.errorMessage ? (
        <p className="document-upload-card__error">{item.errorMessage}</p>
      ) : null}
    </article>
  )
}
