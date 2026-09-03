import type { SolicitudDocumentoAdjuntoDto } from '../../types/documentosAdjuntos'
import {
  canPreviewSolicitudDocument,
  downloadSolicitudDocument,
  openSolicitudDocument,
} from '../../utils/solicitudDocumentFile'
import './DocumentosAdjuntos.css'

interface DocumentosAdjuntosProps {
  documentos: SolicitudDocumentoAdjuntoDto[]
  isLoading: boolean
  error?: string | null
  onRetry?: () => void
}

const DocumentosAdjuntos = ({ documentos, isLoading, error, onRetry }: DocumentosAdjuntosProps) => {
  const handleOpen = (documento: SolicitudDocumentoAdjuntoDto) => {
    void openSolicitudDocument(documento.base64Contenido, documento.mimeType, documento.nombreArchivo)
  }

  const handleDownload = (documento: SolicitudDocumentoAdjuntoDto) => {
    void downloadSolicitudDocument(documento.base64Contenido, documento.mimeType, documento.nombreArchivo)
  }

  return (
    <section className="documentos-adjuntos" aria-live="polite">
      <header className="documentos-adjuntos__header">
        <h3>Documentos adjuntos</h3>
      </header>

      {isLoading ? (
        <p className="documentos-adjuntos__status">Cargando documentos…</p>
      ) : error ? (
        <div className="documentos-adjuntos__status documentos-adjuntos__status--error" role="alert">
          <p>{error}</p>
          {onRetry && (
            <button className="documentos-adjuntos__retry" type="button" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      ) : documentos.length === 0 ? (
        <p className="documentos-adjuntos__status">No hay documentos adjuntos.</p>
      ) : (
        <div className="documentos-adjuntos__table-wrapper sapp-table-shell">
          <table className="documentos-adjuntos__table sapp-table">
            <thead>
              <tr>
                <th scope="col">Nombre archivo</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento) => {
                const hasFileData = Boolean(documento.base64Contenido && documento.mimeType)
                const canOpen = hasFileData && canPreviewSolicitudDocument(documento.mimeType)

                return (
                  <tr key={documento.idDocumento}>
                    <td>
                      <p className="documentos-adjuntos__filename">{documento.nombreArchivo}</p>
                      {documento.descripcion && (
                        <p className="documentos-adjuntos__description">{documento.descripcion}</p>
                      )}
                    </td>
                    <td>
                      <div className="documentos-adjuntos__actions">
                        <button
                          type="button"
                          onClick={() => handleOpen(documento)}
                          disabled={!canOpen}
                          aria-label={`Ver ${documento.nombreArchivo}`}
                          title={canOpen ? 'Abrir documento como PDF en una pestaña nueva' : 'Vista previa no disponible'}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(documento)}
                          disabled={!hasFileData}
                          aria-label={`Descargar ${documento.nombreArchivo}`}
                        >
                          Descargar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default DocumentosAdjuntos
