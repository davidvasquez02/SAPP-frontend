import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { DocumentUploadItem } from '../../modules/documentos/types/documentUploadTypes'
import { openBase64InNewTab } from '../../shared/files/base64FileUtils'
import { FileSelectButton } from '../FileSelectButton/FileSelectButton'
import './DocumentUploadCard.css'

interface DocumentUploadCardProps {
  item: DocumentUploadItem
  onSelectFile: (id: number, file: File | null) => void
  onUpload?: (id: number) => void
  showUploadButton?: boolean
  onRemoveFile?: (id: number) => void
  disabled?: boolean
  fileAccept?: string
  previewAsImage?: boolean
  multiple?: boolean
  maxFiles?: number
  selectedFiles?: File[]
  onSelectFiles?: (id: number, files: File[]) => void
  onRemoveSelectedFile?: (id: number, index: number) => void
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
  fileAccept,
  previewAsImage = false,
  showUploadButton = true,
  multiple = false,
  maxFiles,
  selectedFiles = [],
  onSelectFiles,
  onRemoveSelectedFile,
}: DocumentUploadCardProps) => {
  const [selectedPreviewDataUrl, setSelectedPreviewDataUrl] = useState<string | null>(null)
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
  const uploadedPreviewUrl = useMemo(() => {
    if (!previewAsImage || !item.uploadedBase64 || !item.uploadedMimeType?.startsWith('image/')) {
      return null
    }
    return `data:${item.uploadedMimeType};base64,${item.uploadedBase64}`
  }, [item.uploadedBase64, item.uploadedMimeType, previewAsImage])
  const previewUrl = item.selectedFile ? selectedPreviewDataUrl : uploadedPreviewUrl
  const hasUploadedFile = item.status === 'UPLOADED' || item.status === 'APPROVED' || item.status === 'REJECTED'
  const selectButtonLabel = hasUploadedFile
    ? `Reemplazar ${previewAsImage ? 'foto' : 'archivo'}`
    : previewAsImage
      ? 'Seleccionar foto'
      : 'Seleccionar archivo'
  const reachedFileLimit = multiple && maxFiles != null && selectedFiles.length >= maxFiles

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (multiple && onSelectFiles) {
      const remainingSlots = maxFiles == null ? Number.POSITIVE_INFINITY : Math.max(maxFiles - selectedFiles.length, 0)
      const files = Array.from(event.target.files ?? []).slice(0, remainingSlots)
      if (files.length > 0) onSelectFiles(item.id, files)
      event.target.value = ''
      return
    }
    const file = event.target.files?.[0] ?? null
    if (previewAsImage && file?.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedPreviewDataUrl(typeof reader.result === 'string' ? reader.result : null)
      }
      reader.readAsDataURL(file)
    } else {
      setSelectedPreviewDataUrl(null)
    }
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
        {previewAsImage ? (
          <div className="document-upload-card__thumbnail">
            {previewUrl ? (
              <img src={previewUrl} alt={`Vista previa de ${item.nombre}`} />
            ) : (
              <span>Sin foto</span>
            )}
          </div>
        ) : null}
      </div>

      <div className="document-upload-card__actions">
        {multiple && maxFiles != null ? (
          <p className="document-upload-card__file-limit" id={`${inputId}-limit`}>
            Puedes adjuntar máximo {maxFiles} documentos. {selectedFiles.length} de {maxFiles} seleccionados.
          </p>
        ) : null}
        <FileSelectButton
          id={inputId}
          accept={fileAccept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || reachedFileLimit}
          aria-describedby={multiple && maxFiles != null ? `${inputId}-limit` : undefined}
        >
          {reachedFileLimit ? 'Límite alcanzado' : multiple ? 'Seleccionar archivos' : selectButtonLabel}
        </FileSelectButton>
        {multiple && selectedFiles.length > 0 ? (
          <ul className="document-upload-card__selected-files" aria-label="Archivos seleccionados">
            {selectedFiles.map((file, index) => (
              <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                <span>{file.name}</span>
                {onRemoveSelectedFile ? (
                  <button type="button" onClick={() => onRemoveSelectedFile(item.id, index)} disabled={disabled}>
                    Quitar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
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
        {onUpload && showUploadButton ? (
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
            {previewAsImage ? 'Ver foto' : 'Ver documento'}
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
