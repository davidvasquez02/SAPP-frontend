import { useRef, useState } from 'react'
import type { DocumentoRequerido } from '../../types'
import './DocumentosRequeridosTable.css'

type DocumentoAction = 'VER' | 'SUBIR' | 'DESCARGAR'

type DocumentosRequeridosTableProps = {
  documentos: DocumentoRequerido[]
  onAction?: (docId: number, action: DocumentoAction) => void
}

const statusClassByEstado: Record<DocumentoRequerido['estado'], string> = {
  PENDIENTE: 'pendiente',
  EN_REVISION: 'revision',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
}

const DocumentosRequeridosTable = ({ documentos, onAction }: DocumentosRequeridosTableProps) => {
  const [uploadedNames, setUploadedNames] = useState<Record<number, string>>({})
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  return (
    <div className="documentos-requeridos-table__wrapper">
      <table className="documentos-requeridos-table">
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
                  {uploadedNames[doc.id] ? (
                    <small className="documentos-requeridos-table__file-name">{uploadedNames[doc.id]}</small>
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
                  <button type="button" disabled onClick={() => onAction?.(doc.id, 'VER')}>
                    Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAction?.(doc.id, 'SUBIR')
                      fileInputRefs.current[doc.id]?.click()
                    }}
                  >
                    Subir
                  </button>
                  <button type="button" disabled onClick={() => onAction?.(doc.id, 'DESCARGAR')}>
                    Descargar
                  </button>
                  <input
                    ref={(element) => {
                      fileInputRefs.current[doc.id] = element
                    }}
                    className="documentos-requeridos-table__file-input"
                    type="file"
                    onChange={(event) => {
                      const fileName = event.target.files?.[0]?.name
                      if (!fileName) {
                        return
                      }

                      setUploadedNames((current) => ({ ...current, [doc.id]: fileName }))
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
