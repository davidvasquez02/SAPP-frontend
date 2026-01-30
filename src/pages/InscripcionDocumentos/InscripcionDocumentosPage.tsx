import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { aprobarRechazarDocumento } from '../../modules/documentos/api/aprobacionDocumentosService'
import { getDocumentosByTramite } from '../../modules/documentos/api/documentosService'
import type { DocumentoTramiteItemDto } from '../../modules/documentos/api/types'
import { downloadBase64File, openBase64InNewTab } from '../../shared/files/base64FileUtils'
import './InscripcionDocumentosPage.css'

type DocumentoDecision = 'APROBAR' | 'RECHAZAR' | null

interface DocumentoDecisionState {
  decision: DocumentoDecision
  motivoRechazo: string
  errorMotivo: string | null
  loading: boolean
}

interface DocumentoActionState {
  viewing: boolean
  downloading: boolean
}

const InscripcionDocumentosPage = () => {
  const { convocatoriaId, inscripcionId } = useParams()
  const { session, user } = useAuth()
  const [documentos, setDocumentos] = useState<DocumentoTramiteItemDto[]>([])
  const [decisionStates, setDecisionStates] = useState<Record<number, DocumentoDecisionState>>(
    {},
  )
  const [actionStates, setActionStates] = useState<Record<number, DocumentoActionState>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const tramiteId = useMemo(() => Number(inscripcionId), [inscripcionId])
  const canManageDocuments = useMemo(() => {
    if (!session || session.kind !== 'SAPP' || !user || !('username' in user)) {
      return false
    }

    return hasAnyRole(user.roles, [ROLES.COORDINACION, ROLES.SECRETARIA])
  }, [session, user])

  const getDecisionState = useCallback(
    (id: number): DocumentoDecisionState =>
      decisionStates[id] ?? {
        decision: null,
        motivoRechazo: '',
        errorMotivo: null,
        loading: false,
      },
    [decisionStates],
  )

  const getActionState = useCallback(
    (id: number): DocumentoActionState =>
      actionStates[id] ?? {
        viewing: false,
        downloading: false,
      },
    [actionStates],
  )

  const updateDecisionState = useCallback(
    (id: number, updates: Partial<DocumentoDecisionState>) => {
      setDecisionStates((prev) => ({
        ...prev,
        [id]: {
          decision: null,
          motivoRechazo: '',
          errorMotivo: null,
          loading: false,
          ...prev[id],
          ...updates,
        },
      }))
    },
    [],
  )

  const updateActionState = useCallback((id: number, updates: Partial<DocumentoActionState>) => {
    setActionStates((prev) => ({
      ...prev,
      [id]: {
        viewing: false,
        downloading: false,
        ...prev[id],
        ...updates,
      },
    }))
  }, [])

  const fetchDocumentos = useCallback(async () => {
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
  }, [tramiteId])

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

    void fetchDocumentos()
  }, [fetchDocumentos, inscripcionId, tramiteId])

  const handleDecisionSelect = (id: number, decision: DocumentoDecision) => {
    updateDecisionState(id, {
      decision: getDecisionState(id).decision === decision ? null : decision,
      errorMotivo: null,
    })
  }

  const handleMotivoChange = (id: number, value: string) => {
    updateDecisionState(id, {
      motivoRechazo: value,
      errorMotivo: null,
    })
  }

  const handleConfirmDecision = async (id: number, aprobado: boolean) => {
    const estado = getDecisionState(id)
    const motivo = estado.motivoRechazo.trim()

    if (!aprobado && !motivo) {
      updateDecisionState(id, { errorMotivo: 'Debe ingresar el motivo del rechazo.' })
      return
    }

    updateDecisionState(id, { loading: true })

    try {
      await aprobarRechazarDocumento({
        documentoId: id,
        aprobado,
        observaciones: aprobado ? null : motivo,
      })
      window.alert(aprobado ? 'Documento aprobado.' : 'Documento rechazado.')
      await fetchDocumentos()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(message)
    } finally {
      updateDecisionState(id, { loading: false })
    }
  }

  const handleViewDocumento = async (
    documentoId: number,
    base64?: string,
    mimeType?: string,
    filename?: string,
  ) => {
    if (!base64) {
      window.alert('No hay contenido para visualizar.')
      return
    }

    updateActionState(documentoId, { viewing: true })
    try {
      await new Promise((resolve) => setTimeout(resolve, 0))
      openBase64InNewTab(base64, mimeType ?? 'application/pdf', filename)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(message)
    } finally {
      updateActionState(documentoId, { viewing: false })
    }
  }

  const handleDownloadDocumento = async (
    documentoId: number,
    base64?: string,
    mimeType?: string,
    filename?: string,
  ) => {
    if (!base64) {
      window.alert('No hay contenido para descargar.')
      return
    }

    updateActionState(documentoId, { downloading: true })
    try {
      await new Promise((resolve) => setTimeout(resolve, 0))
      downloadBase64File(
        base64,
        mimeType ?? 'application/pdf',
        filename ?? 'documento.pdf',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(message)
    } finally {
      updateActionState(documentoId, { downloading: false })
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
              {canManageDocuments ? <span>Acciones</span> : null}
            </div>
            {documentos.map((documento) => {
              const documentoId = documento.documentoUploadedResponse?.idDocumento
              const uploaded =
                documento.documentoCargado === true && documento.documentoUploadedResponse != null
              const decisionState = documentoId ? getDecisionState(documentoId) : null
              const isLoadingDecision = decisionState?.loading ?? false
              const actionState = documentoId ? getActionState(documentoId) : null
              const documentoResponse = documento.documentoUploadedResponse
              const base64 =
                documentoResponse?.base64DocumentoContenido ?? documentoResponse?.contenidoBase64
              const mimeType =
                documentoResponse?.mimeTypeDocumentoContenido ??
                documentoResponse?.mimeType ??
                'application/pdf'
              const filename =
                documentoResponse?.nombreArchivoDocumento ??
                `documento_${documento.idTipoDocumentoTramite}.pdf`

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
                    <div className="inscripcion-documentos__decision-actions">
                      <button
                        type="button"
                        className={
                          decisionState?.decision === 'APROBAR'
                            ? 'inscripcion-documentos__decision-button is-active is-approve'
                            : 'inscripcion-documentos__decision-button'
                        }
                        onClick={() => documentoId && handleDecisionSelect(documentoId, 'APROBAR')}
                        disabled={!uploaded || isLoadingDecision}
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className={
                          decisionState?.decision === 'RECHAZAR'
                            ? 'inscripcion-documentos__decision-button is-active is-reject'
                            : 'inscripcion-documentos__decision-button'
                        }
                        onClick={() => documentoId && handleDecisionSelect(documentoId, 'RECHAZAR')}
                        disabled={!uploaded || isLoadingDecision}
                      >
                        Rechazar
                      </button>
                    </div>
                    {!uploaded ? (
                      <span className="inscripcion-documentos__hint">
                        Pendiente por cargar
                      </span>
                    ) : null}
                    {decisionState?.decision === 'RECHAZAR' ? (
                      <div className="inscripcion-documentos__decision-panel">
                        <label className="inscripcion-documentos__decision-label" htmlFor={`motivo-${documentoId}`}>
                          Motivo del rechazo
                        </label>
                        <textarea
                          id={`motivo-${documentoId}`}
                          className="inscripcion-documentos__decision-textarea"
                          value={decisionState.motivoRechazo}
                          onChange={(event) =>
                            documentoId && handleMotivoChange(documentoId, event.target.value)
                          }
                          rows={3}
                        />
                        {decisionState.errorMotivo ? (
                          <span className="inscripcion-documentos__decision-error">
                            {decisionState.errorMotivo}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className="inscripcion-documentos__decision-confirm"
                          onClick={() => documentoId && handleConfirmDecision(documentoId, false)}
                          disabled={isLoadingDecision}
                        >
                          {isLoadingDecision ? 'Enviando...' : 'Confirmar rechazo'}
                        </button>
                      </div>
                    ) : null}
                    {decisionState?.decision === 'APROBAR' ? (
                      <div className="inscripcion-documentos__decision-panel">
                        <button
                          type="button"
                          className="inscripcion-documentos__decision-confirm"
                          onClick={() => documentoId && handleConfirmDecision(documentoId, true)}
                          disabled={isLoadingDecision}
                        >
                          {isLoadingDecision ? 'Enviando...' : 'Confirmar aprobación'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {canManageDocuments ? (
                    <div className="inscripcion-documentos__file-actions">
                      <button
                        type="button"
                        className="inscripcion-documentos__view-button"
                        onClick={() =>
                          documentoId &&
                          handleViewDocumento(documentoId, base64, mimeType, filename)
                        }
                        disabled={!uploaded || actionState?.viewing || actionState?.downloading}
                      >
                        {actionState?.viewing ? 'Abriendo...' : 'Ver'}
                      </button>
                      <button
                        type="button"
                        className="inscripcion-documentos__download-button"
                        onClick={() =>
                          documentoId &&
                          handleDownloadDocumento(documentoId, base64, mimeType, filename)
                        }
                        disabled={!uploaded || actionState?.viewing || actionState?.downloading}
                      >
                        {actionState?.downloading ? 'Descargando...' : 'Descargar'}
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </ModuleLayout>
  )
}

export default InscripcionDocumentosPage
