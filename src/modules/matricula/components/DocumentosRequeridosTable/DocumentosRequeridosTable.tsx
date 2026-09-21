import { useRef } from 'react'
import type { DocumentoRequerido } from '../../types'
import './DocumentosRequeridosTable.css'

type DocumentoAction = 'VER' | 'SUBIR' | 'DESCARGAR'

type DocumentosRequeridosTableProps = {
  documentos: DocumentoRequerido[]
  onAction?: (docId: number, action: DocumentoAction) => void
  onSelectFile?: (docId: number, file: File | null) => void
  disabledActions?: boolean
  showActions?: boolean
  uploadDisabledOnly?: boolean
}

const statusClassByEstado: Record<DocumentoRequerido['estado'], string> = {
  PENDIENTE: 'pendiente',
  EN_REVISION: 'revision',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
}

const formatDateOnly = (value: string | null) => {
  if (!value) return '-'

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value

  return date.toISOString().slice(0, 10)
}

const DocumentosRequeridosTable = ({
  documentos,
  onAction,
  onSelectFile,
  disabledActions = false,
  showActions = true,
  uploadDisabledOnly = false,
}: DocumentosRequeridosTableProps) => {
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  return (
    <div className="documentos-requeridos-table__wrapper sapp-table-shell">
      <table className="documentos-requeridos-table sapp-table">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Estado</th>
            <th>Fecha de revisión</th>
            <th>Observaciones</th>
            {showActions ? <th>Acciones</th> : null}
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => {
            const hasUploadedFile = doc.uploadStatus === 'UPLOADED'
            const uploadBlocked =
              disabledActions ||
              uploadDisabledOnly ||
              doc.uploadStatus === 'UPLOADING' ||
              doc.estado === 'APROBADO' ||
              (hasUploadedFile && doc.estado !== 'RECHAZADO')

            return (
            <tr key={doc.id}>
              <td data-label="Documento">
                <div className="documentos-requeridos-table__doc-cell">
                  <strong>{doc.nombre}</strong>
                  <span className={`documentos-requeridos-table__badge ${doc.obligatorio ? 'required' : 'optional'}`}>
                    {doc.obligatorio ? 'Obligatorio' : 'Opcional'}
                  </span>
                  {doc.uploadedFileName ? (
                    <small className="documentos-requeridos-table__file-name">{doc.uploadedFileName}</small>
                  ) : null}
                  {doc.selectedFile ? (
                    <small className="documentos-requeridos-table__file-name">{doc.selectedFile.name}</small>
                  ) : null}
                  {doc.errorMessage ? (
                    <small className="documentos-requeridos-table__file-name">{doc.errorMessage}</small>
                  ) : null}
                </div>
              </td>
              <td data-label="Estado">
                <span className={`documentos-requeridos-table__status ${statusClassByEstado[doc.estado]}`}>{doc.estado}</span>
              </td>
              <td data-label="Fecha de revisión">{formatDateOnly(doc.fechaRevision)}</td>
              <td data-label="Observaciones">{doc.observaciones ?? '-'}</td>
              {showActions ? (
                <td data-label="Acciones">
                  <div className="documentos-requeridos-table__actions">
                    <button
                      type="button"
                      disabled={uploadBlocked}
                      onClick={() => {
                        onAction?.(doc.id, 'SUBIR')
                        fileInputRefs.current[doc.id]?.click()
                      }}
                    >
                      Cargar
                    </button>
                    {hasUploadedFile ? (
                      <button type="button" className="sapp-document-action" disabled={disabledActions} onClick={() => onAction?.(doc.id, 'VER')}>
                        Ver
                      </button>
                    ) : null}
                    {hasUploadedFile ? (
                      <button type="button" className="sapp-document-action" disabled={disabledActions} onClick={() => onAction?.(doc.id, 'DESCARGAR')}>
                        Descargar
                      </button>
                    ) : null}
                    <input
                      ref={(element) => {
                        fileInputRefs.current[doc.id] = element
                      }}
                      className="documentos-requeridos-table__file-input"
                      type="file"
                      disabled={uploadBlocked}
                      onChange={(event) => {
                        onSelectFile?.(doc.id, event.target.files?.[0] ?? null)
                      }}
                    />
                  </div>
                </td>
              ) : null}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentosRequeridosTable
