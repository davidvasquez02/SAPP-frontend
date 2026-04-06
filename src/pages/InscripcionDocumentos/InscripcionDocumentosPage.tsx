import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { aprobarRechazarDocumento } from '../../modules/documentos/api/aprobacionDocumentosService'
import { getDocumentosByTramite } from '../../modules/documentos/api/documentosService'
import { invalidateEvaluacionAvailabilityCache } from '../../modules/admisiones/api/evaluacionAdmisionAvailabilityCache'
import { iniciarEvaluacion } from '../../modules/admisiones/api/iniciarEvaluacionService'
import type { DocumentoTramiteItemDto } from '../../modules/documentos/api/types'
import type {
  DocumentoTramiteUiItem,
  DocumentoValidacionEstado,
} from '../../modules/documentos/types/ui'
import { downloadBase64File, openBase64InNewTab } from '../../shared/files/base64FileUtils'
import './InscripcionDocumentosPage.css'

interface RechazoState {
  motivoRechazo: string
  errorMotivo: string | null
}

interface DocumentoActionState {
  viewing: boolean
  downloading: boolean
}

const getEstadoUi = (
  documento: DocumentoTramiteItemDto,
): DocumentoValidacionEstado => {
  if (!documento.documentoCargado) {
    return 'PENDIENTE'
  }

  const estado = documento.documentoUploadedResponse?.estadoDocumento?.toUpperCase()

  if (estado === 'APROBADO' || estado === 'RECHAZADO' || estado === 'POR_REVISAR') {
    return estado
  }

  return 'POR_REVISAR'
}

const InscripcionDocumentosPage = () => {
  const { convocatoriaId, inscripcionId } = useParams()
  const navigate = useNavigate()
  const { session, user } = useAuth()
  const [documentos, setDocumentos] = useState<DocumentoTramiteUiItem[]>([])
  const [rechazoStates, setRechazoStates] = useState<Record<number, RechazoState>>({})
  const [actionStates, setActionStates] = useState<Record<number, DocumentoActionState>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [busyDocumentoId, setBusyDocumentoId] = useState<number | null>(null)
  const [isStartingEvaluacion, setIsStartingEvaluacion] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const tramiteId = useMemo(() => Number(inscripcionId), [inscripcionId])
  const canManageDocuments = useMemo(() => {
    if (!session || session.kind !== 'SAPP' || !user || !('username' in user)) {
      return false
    }

    return hasAnyRole(user.roles, [ROLES.COORDINACION, ROLES.SECRETARIA])
  }, [session, user])

  const getRechazoState = useCallback(
    (id: number): RechazoState =>
      rechazoStates[id] ?? {
        motivoRechazo: '',
        errorMotivo: null,
      },
    [rechazoStates],
  )

  const getActionState = useCallback(
    (id: number): DocumentoActionState =>
      actionStates[id] ?? {
        viewing: false,
        downloading: false,
      },
    [actionStates],
  )

  const updateRechazoState = useCallback((id: number, updates: Partial<RechazoState>) => {
    setRechazoStates((prev) => ({
      ...prev,
      [id]: {
        motivoRechazo: '',
        errorMotivo: null,
        ...prev[id],
        ...updates,
      },
    }))
  }, [])

  const closeRechazoPanel = useCallback((id: number) => {
    setRechazoStates((prev) => {
      if (!(id in prev)) {
        return prev
      }

      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const loadDocumentos = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const data = await getDocumentosByTramite(tramiteId)
      setDocumentos(
        data.map((documento) => ({
          ...documento,
          validacionEstado: getEstadoUi(documento),
          validacionObservaciones:
            documento.documentoUploadedResponse?.observacionesDocumento ?? null,
        })),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }, [tramiteId])

  const sortedDocumentos = useMemo(
    () =>
      [...documentos].sort((a, b) =>
        a.codigoTipoDocumentoTramite.localeCompare(b.codigoTipoDocumentoTramite),
      ),
    [documentos],
  )

  const handleApprove = async (id: number) => {
    setBusyDocumentoId(id)
    try {
      await aprobarRechazarDocumento({
        documentoId: id,
        aprobado: true,
        observaciones: null,
      })
      await loadDocumentos()
      closeRechazoPanel(id)
      window.alert('Documento aprobado.')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(message)
    } finally {
      setBusyDocumentoId(null)
    }
  }

  const handleMotivoChange = (id: number, value: string) => {
    updateRechazoState(id, {
      motivoRechazo: value,
      errorMotivo: null,
    })
  }

  const handleOpenRechazo = (id: number) => {
    updateRechazoState(id, {
      motivoRechazo: getRechazoState(id).motivoRechazo,
      errorMotivo: null,
    })
  }

  const handleConfirmReject = async (id: number) => {
    const estado = getRechazoState(id)
    const motivo = estado.motivoRechazo.trim()

    if (!motivo) {
      updateRechazoState(id, { errorMotivo: 'Debe ingresar el motivo del rechazo.' })
      return
    }

    setBusyDocumentoId(id)
    try {
      await aprobarRechazarDocumento({
        documentoId: id,
        aprobado: false,
        observaciones: motivo,
      })
      await loadDocumentos()
      closeRechazoPanel(id)
      window.alert('Documento rechazado.')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(message)
    } finally {
      setBusyDocumentoId(null)
    }
  }

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

    void loadDocumentos()
  }, [inscripcionId, loadDocumentos, tramiteId])

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

  const getEstadoDocumento = useCallback((documento: DocumentoTramiteItemDto) => {
    if (!documento.documentoCargado) {
      return null
    }

    return documento.documentoUploadedResponse?.estadoDocumento?.toUpperCase() ?? 'POR_REVISAR'
  }, [])

  const requiredDocs = useMemo(
    () => sortedDocumentos.filter((documento) => documento.obligatorioTipoDocumentoTramite),
    [sortedDocumentos],
  )

  const requiredApprovedCount = useMemo(
    () =>
      requiredDocs.filter(
        (documento) =>
          documento.documentoCargado && getEstadoDocumento(documento) === 'APROBADO',
      ).length,
    [getEstadoDocumento, requiredDocs],
  )

  const allRequiredApproved = useMemo(
    () =>
      requiredDocs.every(
        (documento) =>
          documento.documentoCargado && getEstadoDocumento(documento) === 'APROBADO',
      ),
    [getEstadoDocumento, requiredDocs],
  )

  const handleContinue = async () => {
    if (!convocatoriaId || !inscripcionId || Number.isNaN(tramiteId)) {
      window.alert('No se encontró una inscripción válida para iniciar evaluación.')
      return
    }

    setIsStartingEvaluacion(true)
    try {
      await iniciarEvaluacion(tramiteId)
      invalidateEvaluacionAvailabilityCache(tramiteId)
      navigate(`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}/hoja-vida`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(message)
    } finally {
      setIsStartingEvaluacion(false)
    }
  }

  return (
    <section className="inscripcion-documentos">
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
          {sortedDocumentos.map((documento) => {
            const documentoId = documento.documentoUploadedResponse?.idDocumento
            const uploaded =
              documento.documentoCargado === true && documento.documentoUploadedResponse != null
            const rechazoState = documentoId ? getRechazoState(documentoId) : null
            const isLoadingDecision = documentoId != null && busyDocumentoId === documentoId
            const actionState = documentoId ? getActionState(documentoId) : null
            const validacionEstado = documento.validacionEstado
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
                  {uploaded ? (
                    <>
                      <span
                        className={`inscripcion-documentos__badge ${
                          validacionEstado === 'APROBADO'
                            ? 'inscripcion-documentos__badge--validation-approved'
                            : validacionEstado === 'RECHAZADO'
                              ? 'inscripcion-documentos__badge--validation-rejected'
                              : 'inscripcion-documentos__badge--validation-neutral'
                        }`}
                      >
                        {validacionEstado === 'APROBADO'
                          ? 'Aprobado'
                          : validacionEstado === 'RECHAZADO'
                            ? 'Rechazado'
                            : 'Por revisar'}
                      </span>
                      {validacionEstado === 'RECHAZADO' &&
                      documento.validacionObservaciones ? (
                        <p className="inscripcion-documentos__validation-note">
                          Motivo: {documento.validacionObservaciones}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <span className="inscripcion-documentos__badge inscripcion-documentos__badge--validation-pending">
                      Pendiente
                    </span>
                  )}
                </div>
                {canManageDocuments ? (
                  <div>
                    <div className="inscripcion-documentos__actions-row">
                      <div className="inscripcion-documentos__actions-group">
                        <button
                          type="button"
                          className="inscripcion-documentos__view-button"
                          onClick={() =>
                            documentoId &&
                            handleViewDocumento(documentoId, base64, mimeType, filename)
                          }
                          disabled={!uploaded || actionState?.viewing || actionState?.downloading}
                          aria-disabled={
                            !uploaded || actionState?.viewing || actionState?.downloading
                          }
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
                          aria-disabled={
                            !uploaded || actionState?.viewing || actionState?.downloading
                          }
                        >
                          {actionState?.downloading ? 'Descargando...' : 'Descargar'}
                        </button>
                      </div>
                      <div className="inscripcion-documentos__actions-group">
                        <button
                          type="button"
                          className={`inscripcion-documentos__decision-button ${
                            validacionEstado === 'APROBADO'
                              ? 'is-active is-approve'
                              : ''
                          }`}
                          onClick={() => documentoId && void handleApprove(documentoId)}
                          disabled={!uploaded || isLoadingDecision}
                          aria-disabled={!uploaded || isLoadingDecision}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className={`inscripcion-documentos__decision-button ${
                            validacionEstado === 'RECHAZADO'
                              ? 'is-active is-reject'
                              : ''
                          }`}
                          onClick={() => documentoId && handleOpenRechazo(documentoId)}
                          disabled={!uploaded || isLoadingDecision}
                          aria-disabled={!uploaded || isLoadingDecision}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                    {rechazoState && documentoId ? (
                      <div className="inscripcion-documentos__decision-panel">
                        <label
                          className="inscripcion-documentos__decision-label"
                          htmlFor={`motivo-${documentoId}`}
                        >
                          Motivo del rechazo
                        </label>
                        <textarea
                          id={`motivo-${documentoId}`}
                          className="inscripcion-documentos__decision-textarea"
                          value={rechazoState.motivoRechazo}
                          onChange={(event) => handleMotivoChange(documentoId, event.target.value)}
                          rows={3}
                        />
                        {rechazoState.errorMotivo ? (
                          <span className="inscripcion-documentos__decision-error">
                            {rechazoState.errorMotivo}
                          </span>
                        ) : null}
                        <div className="inscripcion-documentos__actions-group">
                          <button
                            type="button"
                            className="inscripcion-documentos__decision-confirm"
                            onClick={() => void handleConfirmReject(documentoId)}
                            disabled={isLoadingDecision}
                            aria-disabled={isLoadingDecision}
                          >
                            {isLoadingDecision ? 'Procesando...' : 'Confirmar rechazo'}
                          </button>
                          <button
                            type="button"
                            className="inscripcion-documentos__view-button"
                            onClick={() => closeRechazoPanel(documentoId)}
                            disabled={isLoadingDecision}
                            aria-disabled={isLoadingDecision}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {isLoadingDecision ? (
                      <p className="inscripcion-documentos__processing">Procesando...</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
          <div className="inscripcion-documentos__footer">
            <div>
              <p className="inscripcion-documentos__footer-title">
                Obligatorios aprobados: {requiredApprovedCount}/{requiredDocs.length}
              </p>
              {!allRequiredApproved ? (
                <p className="inscripcion-documentos__footer-hint">
                  Aprueba todos los documentos obligatorios para continuar.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="inscripcion-documentos__continue-button"
              disabled={!allRequiredApproved || isStartingEvaluacion}
              aria-disabled={!allRequiredApproved || isStartingEvaluacion}
              onClick={() => void handleContinue()}
            >
              {isStartingEvaluacion ? 'Iniciando evaluación...' : 'Continuar evaluación'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default InscripcionDocumentosPage
