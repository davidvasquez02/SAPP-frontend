import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getDocumentosByTramite } from '../../modules/documentos/api/documentosService'
import type { DocumentoTramiteItemDto } from '../../modules/documentos/api/types'
import {
  guardarValidacionDocumentos,
  type EstadoValidacionDocumento,
} from '../../modules/documentos/api/validacionDocumentosService'
import './InscripcionDocumentosPage.css'

const InscripcionDocumentosPage = () => {
  const { convocatoriaId, inscripcionId } = useParams()
  const [documentos, setDocumentos] = useState<DocumentoTramiteItemDto[]>([])
  const [validaciones, setValidaciones] = useState<
    Record<number, EstadoValidacionDocumento | null>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const tramiteId = useMemo(() => Number(inscripcionId), [inscripcionId])

  useEffect(() => {
    if (!inscripcionId) {
      setErrorMessage('No se encontró el identificador de inscripción.')
      setIsLoading(false)
      return
    }

    if (Number.isNaN(tramiteId)) {
      setErrorMessage('El identificador de inscripción no es válido.')
      setIsLoading(false)
      return
    }

    const fetchDocumentos = async () => {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const data = await getDocumentosByTramite(tramiteId)
        setDocumentos(data)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setErrorMessage(message)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchDocumentos()
  }, [inscripcionId, tramiteId])

  const handleValidacionChange = (id: number, estado: EstadoValidacionDocumento) => {
    setValidaciones((prev) => ({
      ...prev,
      [id]: prev[id] === estado ? null : estado,
    }))
  }

  const payloadValidaciones = useMemo(
    () => ({
      tramiteId,
      validaciones: Object.entries(validaciones)
        .filter(([, estado]) => estado != null)
        .map(([tipoDocumentoTramiteId, estado]) => ({
          tipoDocumentoTramiteId: Number(tipoDocumentoTramiteId),
          estado: estado as EstadoValidacionDocumento,
        })),
    }),
    [tramiteId, validaciones],
  )

  const handleGuardarValidaciones = async () => {
    setSaveMessage(null)
    setSaveError(null)
    console.log('[InscripcionDocumentos] payload validaciones:', payloadValidaciones)

    try {
      await guardarValidacionDocumentos(payloadValidaciones)
      setSaveMessage('Validaciones guardadas correctamente.')
    } catch (error) {
      console.error('[InscripcionDocumentos] error guardando validaciones:', error)
      setSaveError('Endpoint pendiente de implementar.')
    }
  }

  return (
    <ModuleLayout title="Admisiones">
      <section className="inscripcion-documentos">
        <Link
          className="inscripcion-documentos__back"
          to={`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`}
        >
          ← Volver a Inscripción
        </Link>
        <h1 className="inscripcion-documentos__title">Documentos cargados</h1>
        <p className="inscripcion-documentos__subtitle">
          Revisa los documentos cargados por el aspirante y marca la validación.
        </p>

        {isLoading ? (
          <p className="inscripcion-documentos__status">Cargando documentos...</p>
        ) : errorMessage ? (
          <p className="inscripcion-documentos__error">{errorMessage}</p>
        ) : documentos.length === 0 ? (
          <p className="inscripcion-documentos__status">No hay documentos registrados.</p>
        ) : (
          <div className="inscripcion-documentos__table">
            <div className="inscripcion-documentos__table-header">
              <span>Documento</span>
              <span>Código</span>
              <span>Requisito</span>
              <span>Estado</span>
              <span>Validación</span>
              <span>Acciones</span>
            </div>
            {documentos.map((documento) => {
              const validacionActual = validaciones[documento.idTipoDocumentoTramite] ?? null
              const uploaded = documento.documentoCargado && documento.documentoUploadedResponse

              return (
                <div key={documento.idTipoDocumentoTramite} className="inscripcion-documentos__table-row">
                  <div>
                    <p className="inscripcion-documentos__doc-name">
                      {documento.nombreTipoDocumentoTramite}
                    </p>
                    {documento.descripcionTipoDocumentoTramite ? (
                      <p className="inscripcion-documentos__doc-description">
                        {documento.descripcionTipoDocumentoTramite}
                      </p>
                    ) : null}
                  </div>
                  <span className="inscripcion-documentos__code">
                    {documento.codigoTipoDocumentoTramite}
                  </span>
                  <span>
                    {documento.obligatorioTipoDocumentoTramite ? (
                      <span className="inscripcion-documentos__badge inscripcion-documentos__badge--required">
                        Obligatorio
                      </span>
                    ) : (
                      <span className="inscripcion-documentos__badge inscripcion-documentos__badge--optional">
                        Opcional
                      </span>
                    )}
                  </span>
                  <div>
                    {uploaded ? (
                      <>
                        <span className="inscripcion-documentos__badge inscripcion-documentos__badge--loaded">
                          Cargado
                        </span>
                        <p className="inscripcion-documentos__file">
                          {documento.documentoUploadedResponse?.nombreArchivoDocumento} (v
                          {documento.documentoUploadedResponse?.versionDocumento})
                        </p>
                      </>
                    ) : (
                      <span className="inscripcion-documentos__badge inscripcion-documentos__badge--pending">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="inscripcion-documentos__validation-actions">
                      <button
                        type="button"
                        className={
                          validacionActual === 'CORRECTO'
                            ? 'inscripcion-documentos__validation-button is-active is-correct'
                            : 'inscripcion-documentos__validation-button'
                        }
                        onClick={() =>
                          handleValidacionChange(documento.idTipoDocumentoTramite, 'CORRECTO')
                        }
                      >
                        Correcto
                      </button>
                      <button
                        type="button"
                        className={
                          validacionActual === 'INCORRECTO'
                            ? 'inscripcion-documentos__validation-button is-active is-incorrect'
                            : 'inscripcion-documentos__validation-button'
                        }
                        onClick={() =>
                          handleValidacionChange(documento.idTipoDocumentoTramite, 'INCORRECTO')
                        }
                      >
                        Incorrecto
                      </button>
                    </div>
                    <span className="inscripcion-documentos__validation-status">
                      {validacionActual ? `Marcado: ${validacionActual}` : 'Sin validar'}
                    </span>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="inscripcion-documentos__view-button"
                      onClick={() =>
                        console.log('[InscripcionDocumentos] Ver documento', documento)
                      }
                      disabled={!uploaded}
                    >
                      Ver
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="inscripcion-documentos__footer">
          <button
            type="button"
            className="inscripcion-documentos__save-button"
            onClick={handleGuardarValidaciones}
            disabled={isLoading || documentos.length === 0}
          >
            Guardar validaciones
          </button>
          {saveMessage ? (
            <span className="inscripcion-documentos__save-message">{saveMessage}</span>
          ) : null}
          {saveError ? <span className="inscripcion-documentos__error">{saveError}</span> : null}
        </div>
      </section>
    </ModuleLayout>
  )
}

export default InscripcionDocumentosPage
