import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { invalidateEvaluacionAvailabilityCache } from '../../modules/admisiones/api/evaluacionAdmisionAvailabilityCache'
import { iniciarEvaluacion } from '../../modules/admisiones/api/iniciarEvaluacionService'
import { aprobarRechazarDocumento } from '../../modules/documentos/api/aprobacionDocumentosService'
import { getDocumentosByTramite } from '../../modules/documentos/api/documentosService'
import type { DocumentoTramiteItemDto } from '../../modules/documentos/api/types'
import ValidationButtons from '../../modules/documentos/components/ValidationButtons/ValidationButtons'
import type { DocumentoTramiteUiItem, DocumentoValidacionEstado } from '../../modules/documentos/types/ui'
import { downloadBase64File, openBase64InNewTab } from '../../shared/files/base64FileUtils'
import './InscripcionDocumentosPage.css'

interface DocumentoActionState {
  viewing: boolean
  downloading: boolean
}

const getEstadoUi = (documento: DocumentoTramiteItemDto): DocumentoValidacionEstado => {
  if (!documento.documentoCargado) {
    return 'PENDIENTE'
  }

  const estado = documento.documentoUploadedResponse?.estadoDocumento?.toUpperCase()

  if (estado === 'APROBADO') {
    return 'APROBADO'
  }

  if (estado === 'RECHAZADO') {
    return 'RECHAZADO'
  }

  return 'POR_REVISAR'
}

const InscripcionDocumentosPage = () => {
  const { convocatoriaId, inscripcionId } = useParams()
  const navigate = useNavigate()
  const { session, user } = useAuth()
  const [documentos, setDocumentos] = useState<DocumentoTramiteUiItem[]>([])
  const [actionStates, setActionStates] = useState<Record<number, DocumentoActionState>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [busyDocumentoId, setBusyDocumentoId] = useState<number | null>(null)
  const [isStartingEvaluacion, setIsStartingEvaluacion] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({})
  const [rejectErrors, setRejectErrors] = useState<Record<number, string | null>>({})

  const tramiteId = useMemo(() => Number(inscripcionId), [inscripcionId])
  const canManageDocuments = useMemo(() => {
    if (!session || session.kind !== 'SAPP' || !user || !('username' in user)) {
      return false
    }

    return hasAnyRole(user.roles, [ROLES.COORDINACION, ROLES.SECRETARIA])
  }, [session, user])

  const getActionState = useCallback(
    (id: number): DocumentoActionState =>
      actionStates[id] ?? {
        viewing: false,
        downloading: false,
      },
    [actionStates],
  )

  const loadDocumentos = useCallback(
    async ({ showLoader }: { showLoader?: boolean } = {}) => {
      const shouldShowLoader = showLoader ?? false

      try {
        if (shouldShowLoader) {
          setIsLoading(true)
        }

        setErrorMessage(null)
        const data = await getDocumentosByTramite(tramiteId)
        const mappedDocumentos = data.map((documento) => ({
          ...documento,
          validacionEstado: getEstadoUi(documento),
          validacionObservaciones: documento.documentoUploadedResponse?.observacionesDocumento ?? null,
        }))

        setDocumentos(mappedDocumentos)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setErrorMessage(message)
      } finally {
        if (shouldShowLoader) {
          setIsLoading(false)
        }
      }
    },
    [tramiteId],
  )

  const sortedDocumentos = useMemo(
    () =>
      [...documentos].sort((a, b) =>
        a.codigoTipoDocumentoTramite.localeCompare(b.codigoTipoDocumentoTramite),
      ),
    [documentos],
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

    void loadDocumentos({ showLoader: true })
  }, [inscripcionId, loadDocumentos, tramiteId])

  const handleApprove = async (id: number, disabled: boolean) => {
    if (disabled) {
      return
    }

    setBusyDocumentoId(id)
    try {
      await aprobarRechazarDocumento({
        documentoId: id,
        aprobado: true,
        observaciones: null,
      })
      await loadDocumentos()
      setRejectingDocId((prev) => (prev === id ? null : prev))
      setRejectErrors((prev) => ({ ...prev, [id]: null }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(message)
    } finally {
      setBusyDocumentoId(null)
    }
  }

  const handleRejectStart = (id: number, disabled: boolean, previousNote: string) => {
    if (disabled) {
      return
    }

    setRejectingDocId(id)
    setRejectNotes((prev) => ({
      ...prev,
      [id]: prev[id] ?? previousNote,
    }))
    setRejectErrors((prev) => ({ ...prev, [id]: null }))
  }

  const handleRejectCancel = (id: number) => {
    setRejectingDocId((prev) => (prev === id ? null : prev))
    setRejectErrors((prev) => ({ ...prev, [id]: null }))
  }

  const handleRejectConfirm = async (id: number, note: string) => {
    const trimmed = note.trim()

    if (!trimmed) {
      setRejectErrors((prev) => ({ ...prev, [id]: 'Debe ingresar el motivo del rechazo.' }))
      return
    }

    setBusyDocumentoId(id)
    try {
      await aprobarRechazarDocumento({
        documentoId: id,
        aprobado: false,
        observaciones: trimmed,
      })
      setRejectNotes((prev) => ({ ...prev, [id]: trimmed }))
      setRejectErrors((prev) => ({ ...prev, [id]: null }))
      setRejectingDocId(null)
      await loadDocumentos()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(message)
    } finally {
      setBusyDocumentoId(null)
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
      downloadBase64File(base64, mimeType ?? 'application/pdf', filename ?? 'documento.pdf')
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
        (documento) => documento.documentoCargado && getEstadoDocumento(documento) === 'APROBADO',
      ).length,
    [getEstadoDocumento, requiredDocs],
  )

  const allRequiredApproved = useMemo(
    () =>
      requiredDocs.every(
        (documento) => documento.documentoCargado && getEstadoDocumento(documento) === 'APROBADO',
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
            <span>Estado</span>
            <span>Validación</span>
            <span>Observaciones</span>
            {canManageDocuments ? <span>Acciones</span> : null}
          </div>
          {sortedDocumentos.map((documento) => {
            const documentoId = documento.documentoUploadedResponse?.idDocumento
            const uploaded =
              documento.documentoCargado === true && documento.documentoUploadedResponse != null
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
            const disableValidation = !uploaded || isLoadingDecision
            const isRejectMode = documentoId != null && rejectingDocId === documentoId
            const currentRejectNote =
              documentoId != null
                ? rejectNotes[documentoId] ?? documento.validacionObservaciones ?? ''
                : ''
            const currentRejectError = documentoId != null ? rejectErrors[documentoId] : null
            const canOpenActions = uploaded && Boolean(base64) && Boolean(mimeType)

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
                  <p className="inscripcion-documentos__meta-line">
                    {documento.obligatorioTipoDocumentoTramite ? 'Obligatorio' : 'Opcional'}
                  </p>
                </div>
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
                <ValidationButtons
                  estadoUi={validacionEstado}
                  disabled={disableValidation}
                  onApprove={() => documentoId && void handleApprove(documentoId, disableValidation)}
                  onRejectStart={() =>
                    documentoId &&
                    handleRejectStart(documentoId, disableValidation, documento.validacionObservaciones ?? '')
                  }
                  isRejectMode={isRejectMode}
                  onRejectCancel={() => documentoId && handleRejectCancel(documentoId)}
                  onRejectConfirm={(note) => documentoId && void handleRejectConfirm(documentoId, note)}
                  rejectNote={currentRejectNote}
                  setRejectNote={(note) =>
                    documentoId &&
                    setRejectNotes((prev) => ({
                      ...prev,
                      [documentoId]: note,
                    }))
                  }
                  rejectError={currentRejectError}
                  textareaId={documentoId ? `motivo-${documentoId}` : undefined}
                />
                <div>
                  {isRejectMode && currentRejectNote.trim() ? (
                    <p className="inscripcion-documentos__validation-note">{currentRejectNote.trim()}</p>
                  ) : (
                    <span className="inscripcion-documentos__observaciones-placeholder">—</span>
                  )}
                </div>
                {canManageDocuments ? (
                  <div className="inscripcion-documentos__docActions">
                    <button
                      type="button"
                      className="inscripcion-documentos__view-button"
                      onClick={() =>
                        documentoId && handleViewDocumento(documentoId, base64, mimeType, filename)
                      }
                      disabled={!canOpenActions || actionState?.viewing || actionState?.downloading}
                      aria-disabled={!canOpenActions || actionState?.viewing || actionState?.downloading}
                    >
                      {actionState?.viewing ? 'Abriendo...' : 'Ver'}
                    </button>
                    <button
                      type="button"
                      className="inscripcion-documentos__download-button"
                      onClick={() =>
                        documentoId && handleDownloadDocumento(documentoId, base64, mimeType, filename)
                      }
                      disabled={!canOpenActions || actionState?.viewing || actionState?.downloading}
                      aria-disabled={!canOpenActions || actionState?.viewing || actionState?.downloading}
                    >
                      {actionState?.downloading ? 'Descargando...' : 'Descargar'}
                    </button>
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
