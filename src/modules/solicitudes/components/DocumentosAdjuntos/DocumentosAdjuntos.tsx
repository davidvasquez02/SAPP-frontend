import { downloadBase64File, openBase64InNewTab } from '../../../../shared/files/base64FileUtils'
import type { SolicitudDocumentoAdjuntoDto } from '../../types/documentosAdjuntos'
import './DocumentosAdjuntos.css'

interface DocumentosAdjuntosProps {
  documentos: SolicitudDocumentoAdjuntoDto[]
  isLoading: boolean
  error?: string | null
  onRetry?: () => void
}

const PDF_MIME_TYPE = 'application/pdf'

const DocumentosAdjuntos = ({ documentos, isLoading, error, onRetry }: DocumentosAdjuntosProps) => {
  const handleOpen = (documento: SolicitudDocumentoAdjuntoDto) => {
    openBase64InNewTab(documento.base64Contenido, documento.mimeType, documento.nombreArchivo)
  }

  const handleDownload = (documento: SolicitudDocumentoAdjuntoDto) => {
    downloadBase64File(documento.base64Contenido, documento.mimeType, documento.nombreArchivo)
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
        <div className="documentos-adjuntos__table-wrapper">
          <table className="documentos-adjuntos__table">
            <thead>
              <tr>
                <th scope="col">Nombre archivo</th>
                <th scope="col">Tipo</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento) => {
                const hasFileData = Boolean(documento.base64Contenido && documento.mimeType)
                const canOpen = hasFileData && documento.mimeType.toLowerCase() === PDF_MIME_TYPE

                return (
                  <tr key={documento.idDocumento}>
                    <td>
                      <p className="documentos-adjuntos__filename">{documento.nombreArchivo}</p>
                      {documento.descripcion && (
                        <p className="documentos-adjuntos__description">{documento.descripcion}</p>
                      )}
                    </td>
                    <td>{documento.mimeType}</td>
                    <td>
                      <div className="documentos-adjuntos__actions">
                        <button
                          type="button"
                          onClick={() => handleOpen(documento)}
                          disabled={!canOpen}
                          aria-label={`Ver ${documento.nombreArchivo}`}
                          title={canOpen ? 'Abrir documento en una pestaña nueva' : 'Disponible solo para PDF'}
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
