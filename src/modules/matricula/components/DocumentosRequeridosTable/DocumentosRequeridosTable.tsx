import { useRef } from 'react'
import type { DocumentoRequerido } from '../../types'
import './DocumentosRequeridosTable.css'

type DocumentoAction = 'VER' | 'SUBIR' | 'DESCARGAR'

type DocumentosRequeridosTableProps = {
  documentos: DocumentoRequerido[]
  onAction?: (docId: number, action: DocumentoAction) => void
  onSelectFile?: (docId: number, file: File | null) => void
  disabledActions?: boolean
}

const statusClassByEstado: Record<DocumentoRequerido['estado'], string> = {
  PENDIENTE: 'pendiente',
  EN_REVISION: 'revision',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
}

const DocumentosRequeridosTable = ({ documentos, onAction, onSelectFile, disabledActions = false }: DocumentosRequeridosTableProps) => {
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
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => (
            <tr key={doc.id}>
              <td>
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
                  {doc.uploadStatus && doc.uploadStatus !== 'NOT_SELECTED' ? (
                    <small className="documentos-requeridos-table__file-name">
                      Estado de carga: {doc.uploadStatus}
                    </small>
                  ) : null}
                  {doc.errorMessage ? (
                    <small className="documentos-requeridos-table__file-name">{doc.errorMessage}</small>
                  ) : null}
                </div>
              </td>
              <td>
                <span className={`documentos-requeridos-table__status ${statusClassByEstado[doc.estado]}`}>{doc.estado}</span>
              </td>
              <td>{doc.fechaRevision ?? '-'}</td>
              <td>{doc.observaciones ?? '-'}</td>
              <td>
                <div className="documentos-requeridos-table__actions">
                  <button type="button" disabled={disabledActions} onClick={() => onAction?.(doc.id, 'VER')}>
                    Ver
                  </button>
                  <button
                    type="button"
                    disabled={disabledActions || doc.uploadStatus === 'UPLOADING'}
                    onClick={() => {
                      onAction?.(doc.id, 'SUBIR')
                      fileInputRefs.current[doc.id]?.click()
                    }}
                  >
                    Subir
                  </button>
                  <button type="button" disabled={disabledActions} onClick={() => onAction?.(doc.id, 'DESCARGAR')}>
                    Descargar
                  </button>
                  <input
                    ref={(element) => {
                      fileInputRefs.current[doc.id] = element
                    }}
                    className="documentos-requeridos-table__file-input"
                    type="file"
                    disabled={disabledActions}
                    onChange={(event) => {
                      onSelectFile?.(doc.id, event.target.files?.[0] ?? null)
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentosRequeridosTable
