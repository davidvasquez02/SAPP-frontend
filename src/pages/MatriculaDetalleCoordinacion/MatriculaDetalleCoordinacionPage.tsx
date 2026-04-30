import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { aprobarRechazarDocumento } from '../../modules/documentos/api/aprobacionDocumentosService'
import type { DocumentoTramiteItemDto } from '../../modules/documentos/api/types'
import ValidationButtons from '../../modules/documentos/components/ValidationButtons/ValidationButtons'
import type { DocumentoValidacionEstado } from '../../modules/documentos/types/ui'
import {
  aprobarMatriculaAcademica,
  getDocumentosMatriculaAcademica,
  getMatriculasAcademicas,
  validarAsignaturasMatriculaAcademica,
} from '../../modules/matricula/services/matriculaAcademicaService'
import type {
  MatriculaAcademicaListadoDto,
  MatriculaAsignaturaValidacionDecision,
  MatriculaAsignaturaValidacionPayload,
  MatriculaValidacionAsignaturasRequest,
} from '../../modules/matricula/types'
import { downloadBase64File, openBase64InNewTab } from '../../shared/files/base64FileUtils'
import './MatriculaDetalleCoordinacionPage.css'

interface DocumentoActionState {
  viewing: boolean
  downloading: boolean
}

type AsignaturaDecisionState = {
  decision: MatriculaAsignaturaValidacionDecision | ''
  observaciones: string
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—'
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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


const getEstadoBadgeClassName = (estado: string) => {
  const normalizedEstado = estado.toUpperCase()

  if (normalizedEstado === 'PENDIENTE_DOCUMENTOS') {
    return 'matricula-page__estado-badge matricula-page__estado-badge--pendiente-documentos'
  }

  if (normalizedEstado === 'RADICADA') {
    return 'matricula-page__estado-badge matricula-page__estado-badge--radicada'
  }

  if (normalizedEstado === 'FINALIZADA') {
    return 'matricula-page__estado-badge matricula-page__estado-badge--finalizada'
  }

  return 'matricula-page__estado-badge matricula-page__estado-badge--default'
}

const MatriculaDetalleCoordinacionPage = () => {
  const { session } = useAuth()
  const { matriculaId } = useParams()
  const navigate = useNavigate()
  const parsedMatriculaId = useMemo(() => Number(matriculaId), [matriculaId])

  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const canManageMatriculas = hasAnyRole(roles, [ROLES.COORDINACION, ROLES.ADMIN])

  const [matricula, setMatricula] = useState<MatriculaAcademicaListadoDto | null>(null)
  const [documentos, setDocumentos] = useState<DocumentoTramiteItemDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyDocumentoId, setBusyDocumentoId] = useState<number | null>(null)
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({})
  const [rejectErrors, setRejectErrors] = useState<Record<number, string | null>>({})
  const [actionStates, setActionStates] = useState<Record<number, DocumentoActionState>>({})
  const [isApprovingMatricula, setIsApprovingMatricula] = useState(false)
  const [asignaturasDecision, setAsignaturasDecision] = useState<Record<number, AsignaturaDecisionState>>({})
  const [isSavingAsignaturas, setIsSavingAsignaturas] = useState(false)

  const normalizedMatriculaEstado = matricula?.estado.toUpperCase() ?? ''
  const isRadicada = normalizedMatriculaEstado === 'RADICADA'
  const isFinalizada = normalizedMatriculaEstado === 'FINALIZADA'
  const disableDocumentValidation = isRadicada || isFinalizada
  const disableAsignaturasValidation = isFinalizada

  const getActionState = useCallback(
    (id: number): DocumentoActionState =>
      actionStates[id] ?? {
        viewing: false,
        downloading: false,
      },
    [actionStates],
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

  const loadDocumentos = useCallback(async () => {
    if (Number.isNaN(parsedMatriculaId)) {
      return
    }

    const documentosData = await getDocumentosMatriculaAcademica(parsedMatriculaId)
    setDocumentos(documentosData)
  }, [parsedMatriculaId])

  const loadDetalle = useCallback(async () => {
    if (Number.isNaN(parsedMatriculaId)) {
      setError('La matrícula solicitada no es válida.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const matriculasData = await getMatriculasAcademicas()

      const selected = matriculasData.find((item) => item.id === parsedMatriculaId)
      if (!selected) {
        setError('No se encontró la matrícula seleccionada.')
        setMatricula(null)
        setAsignaturasDecision({})
      } else {
        setMatricula(selected)
        setAsignaturasDecision(
          selected.asignaturas.reduce<Record<number, AsignaturaDecisionState>>((acc, asignatura) => {
            const estado = asignatura.estado.toUpperCase()
            let decision: MatriculaAsignaturaValidacionDecision | '' = ''
            if (estado === 'APROBADA' || estado === 'MATRICULADA') {
              decision = 'APROBADA'
            } else if (estado === 'RECHAZADA' || estado === 'NO_MATRICULADA') {
              decision = 'NO_MATRICULADA'
            }

            acc[asignatura.id] = {
              decision,
              observaciones: asignatura.observaciones ?? '',
            }

            return acc
          }, {}),
        )
      }

      await loadDocumentos()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar el detalle de la matrícula.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [loadDocumentos, parsedMatriculaId])

  useEffect(() => {
    void loadDetalle()
  }, [loadDetalle])

  const sortedDocumentos = useMemo(
    () =>
      [...documentos].sort((a, b) =>
        a.codigoTipoDocumentoTramite.localeCompare(b.codigoTipoDocumentoTramite),
      ),
    [documentos],
  )

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

  const handleApproveDoc = async (id: number, disabled: boolean) => {
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
    } catch (requestError) {
      window.alert(requestError instanceof Error ? requestError.message : String(requestError))
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
    } catch (requestError) {
      window.alert(requestError instanceof Error ? requestError.message : String(requestError))
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
    } catch (requestError) {
      window.alert(requestError instanceof Error ? requestError.message : String(requestError))
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
    } catch (requestError) {
      window.alert(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      updateActionState(documentoId, { downloading: false })
    }
  }

  const refreshMatriculaAfterApproval = useCallback(async () => {
    if (Number.isNaN(parsedMatriculaId)) {
      return
    }

    const [matriculasData, documentosData] = await Promise.all([
      getMatriculasAcademicas(),
      getDocumentosMatriculaAcademica(parsedMatriculaId),
    ])

    const selected = matriculasData.find((item) => item.id === parsedMatriculaId)
    if (!selected) {
      setError('No se encontró la matrícula seleccionada.')
      setMatricula(null)
      setAsignaturasDecision({})
      setDocumentos([])
      return
    }

    setError(null)
    setMatricula(selected)
    setDocumentos(documentosData)
    setAsignaturasDecision(
      selected.asignaturas.reduce<Record<number, AsignaturaDecisionState>>((acc, asignatura) => {
        const estado = asignatura.estado.toUpperCase()
        let decision: MatriculaAsignaturaValidacionDecision | '' = ''

        if (estado === 'APROBADA' || estado === 'MATRICULADA') {
          decision = 'APROBADA'
        } else if (estado === 'RECHAZADA' || estado === 'NO_MATRICULADA') {
          decision = 'NO_MATRICULADA'
        }

        acc[asignatura.id] = {
          decision,
          observaciones: asignatura.observaciones ?? '',
        }

        return acc
      }, {}),
    )
  }, [parsedMatriculaId])

  const handleAprobarDocumentos = async () => {
    if (!matricula) {
      return
    }

    setIsApprovingMatricula(true)
    try {
      await aprobarMatriculaAcademica(matricula.id)
      await refreshMatriculaAfterApproval()
      window.alert('La matrícula fue aprobada correctamente.')
    } catch (requestError) {
      window.alert(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      setIsApprovingMatricula(false)
    }
  }

  const updateAsignaturaDecision = (
    asignaturaId: number,
    updates: Partial<AsignaturaDecisionState>,
  ) => {
    setAsignaturasDecision((prev) => ({
      ...prev,
      [asignaturaId]: {
        decision: '',
        observaciones: '',
        ...prev[asignaturaId],
        ...updates,
      },
    }))
  }

  const handleGuardarValidacionAsignaturas = async () => {
    if (!matricula || session?.kind !== 'SAPP') {
      return
    }

    const asignaturas: MatriculaAsignaturaValidacionPayload[] = matricula.asignaturas
      .map((asignatura) => {
        const current = asignaturasDecision[asignatura.id]
        if (!current?.decision) {
          return null
        }

        return {
          asignaturaId: asignatura.asignaturaId,
          estado: current.decision,
          observaciones: current.observaciones.trim() || null,
        }
      })
      .filter((item): item is MatriculaAsignaturaValidacionPayload => item !== null)

    if (asignaturas.length === 0) {
      window.alert('Debe seleccionar al menos una asignatura para aprobar o rechazar.')
      return
    }

    const payload: MatriculaValidacionAsignaturasRequest = {
      usuarioRevisionId: session.user.id,
      observaciones: 'Revision manual',
      asignaturas,
    }

    setIsSavingAsignaturas(true)
    try {
      await validarAsignaturasMatriculaAcademica(matricula.id, payload)
      await loadDetalle()
      window.alert('La validación de asignaturas fue guardada correctamente.')
    } catch (requestError) {
      window.alert(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      setIsSavingAsignaturas(false)
    }
  }

  if (!canManageMatriculas) {
    return (
      <ModuleLayout title="Matrícula">
        <p className="matricula-detalle__status">No disponible para tu rol.</p>
      </ModuleLayout>
    )
  }

  return (
    <ModuleLayout title="Matrícula">
      <section className="matricula-detalle">
        <Link to="/matricula" className="matricula-detalle__back">
          ← Volver al listado
        </Link>

        {isLoading ? <p className="matricula-detalle__status">Cargando detalle de matrícula...</p> : null}
        {!isLoading && error ? (
          <p className="matricula-detalle__status matricula-detalle__status--error">{error}</p>
        ) : null}

        {!isLoading && matricula ? (
          <>
            <article className="matricula-detalle__card">
              <header className="matricula-detalle__header">
                <h2>Matrícula de {matricula.estudianteNombreCompleto}</h2>
                <p>{matricula.programaAcademico}</p>
              </header>

              <div className="matricula-detalle__grid">
                <p>
                  <strong>Matrícula:</strong> #{matricula.id}
                </p>
                <p>
                  <strong>Estudiante:</strong> {matricula.estudianteNombreCompleto}
                </p>
                <p>
                  <strong>Código UIS:</strong> {matricula.codigoEstudianteUis ?? '—'}
                </p>
                <p>
                  <strong>Periodo:</strong> {matricula.periodoAcademico}
                </p>
                <p>
                  <strong>Estado:</strong> <span className={getEstadoBadgeClassName(matricula.estado)}>{matricula.estado}</span>
                </p>
                <p>
                  <strong>Fecha solicitud:</strong> {formatDateTime(matricula.fechaSolicitud)}
                </p>
                <p>
                  <strong>Fecha revisión:</strong> {formatDateTime(matricula.fechaRevision)}
                </p>
              </div>
            </article>

            <article className="matricula-detalle__card">
              <header className="matricula-detalle__header">
                <h3>Documentos de la matrícula</h3>
                <p>Valida documentos obligatorios y complementarios antes de aprobar.</p>
              </header>

              {sortedDocumentos.length === 0 ? (
                <p className="matricula-detalle__status">No hay documentos registrados para esta matrícula.</p>
              ) : (
                <div className="matricula-detalle__documents">
                  <div className="matricula-detalle__documents-header">
                    <span>Documento</span>
                    <span>Estado</span>
                    <span>Validación</span>
                    <span>Observaciones</span>
                    <span>Acciones</span>
                  </div>
                  {sortedDocumentos.map((documento) => {
                    const documentoId = documento.documentoUploadedResponse?.idDocumento
                    const uploaded =
                      documento.documentoCargado === true && documento.documentoUploadedResponse != null
                    const isLoadingDecision = documentoId != null && busyDocumentoId === documentoId
                    const actionState = documentoId ? getActionState(documentoId) : null
                    const validacionEstado = getEstadoUi(documento)
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
                    const disableValidation = !uploaded || isLoadingDecision || disableDocumentValidation
                    const isRejectMode = documentoId != null && rejectingDocId === documentoId
                    const currentRejectNote =
                      documentoId != null
                        ? rejectNotes[documentoId] ?? documentoResponse?.observacionesDocumento ?? ''
                        : ''
                    const currentRejectError = documentoId != null ? rejectErrors[documentoId] : null
                    const canOpenActions = uploaded && Boolean(base64) && Boolean(mimeType)

                    return (
                      <div key={documento.idTipoDocumentoTramite} className="matricula-detalle__documents-row">
                        <div>
                          <p className="matricula-detalle__doc-name">{documento.nombreTipoDocumentoTramite}</p>
                          {documento.descripcionTipoDocumentoTramite ? (
                            <p className="matricula-detalle__doc-description">
                              {documento.descripcionTipoDocumentoTramite}
                            </p>
                          ) : null}
                          <p className="matricula-detalle__doc-meta">
                            {documento.obligatorioTipoDocumentoTramite ? 'Obligatorio' : 'Opcional'}
                          </p>
                        </div>

                        <div>
                          {uploaded ? (
                            <span className="matricula-detalle__badge matricula-detalle__badge--loaded">
                              Cargado
                            </span>
                          ) : (
                            <span className="matricula-detalle__badge matricula-detalle__badge--pending">
                              Pendiente
                            </span>
                          )}
                        </div>

                        <ValidationButtons
                          estadoUi={validacionEstado}
                          disabled={disableValidation}
                          onApprove={() =>
                            documentoId && void handleApproveDoc(documentoId, disableValidation)
                          }
                          onRejectStart={() =>
                            documentoId &&
                            handleRejectStart(
                              documentoId,
                              disableValidation,
                              documentoResponse?.observacionesDocumento ?? '',
                            )
                          }
                          isRejectMode={isRejectMode}
                          onRejectCancel={() => documentoId && handleRejectCancel(documentoId)}
                          onRejectConfirm={(note) =>
                            documentoId && void handleRejectConfirm(documentoId, note)
                          }
                          rejectNote={currentRejectNote}
                          setRejectNote={(note) =>
                            documentoId &&
                            setRejectNotes((prev) => ({
                              ...prev,
                              [documentoId]: note,
                            }))
                          }
                          rejectError={currentRejectError}
                          textareaId={documentoId ? `matricula-doc-${documentoId}` : undefined}
                        />

                        <div>
                          {currentRejectNote.trim() ? (
                            <p className="matricula-detalle__validation-note">{currentRejectNote.trim()}</p>
                          ) : (
                            <span className="matricula-detalle__obs-empty">—</span>
                          )}
                        </div>

                        <div className="matricula-detalle__doc-actions">
                          <button
                            type="button"
                            className="matricula-detalle__view-button"
                            onClick={() =>
                              documentoId &&
                              void handleViewDocumento(documentoId, base64, mimeType, filename)
                            }
                            disabled={!canOpenActions || actionState?.viewing || actionState?.downloading}
                          >
                            {actionState?.viewing ? 'Abriendo...' : 'Ver'}
                          </button>
                          <button
                            type="button"
                            className="matricula-detalle__download-button"
                            onClick={() =>
                              documentoId &&
                              void handleDownloadDocumento(documentoId, base64, mimeType, filename)
                            }
                            disabled={!canOpenActions || actionState?.viewing || actionState?.downloading}
                          >
                            {actionState?.downloading ? 'Descargando...' : 'Descargar'}
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  <footer className="matricula-detalle__footer">
                    <div>
                      <p className="matricula-detalle__footer-title">
                        Obligatorios aprobados: {requiredApprovedCount}/{requiredDocs.length}
                      </p>
                      {!allRequiredApproved ? (
                        <p className="matricula-detalle__footer-hint">
                          Debes aprobar todos los documentos obligatorios para finalizar la matrícula.
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="matricula-detalle__approve-button"
                      onClick={() => void handleAprobarDocumentos()}
                      disabled={!allRequiredApproved || isApprovingMatricula || disableDocumentValidation}
                    >
                      {isApprovingMatricula ? 'Aprobando documentos...' : 'Aprobar documentos'}
                    </button>
                  </footer>
                </div>
              )}
            </article>

            <article className="matricula-detalle__card">
              <h3>Asignaturas registradas</h3>
              <div className="matricula-detalle__table-wrapper sapp-table-shell">
                <table className="matricula-detalle__table sapp-table" role="grid">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Asignatura</th>
                      <th>Estado</th>
                      <th>Validación coordinación</th>
                      <th>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matricula.asignaturas.map((asignatura) => {
                      const currentDecision = asignaturasDecision[asignatura.id]?.decision
                      const isRejectSelected = currentDecision === 'NO_MATRICULADA'
                      const isRejectedPersisted = ['RECHAZADA', 'NO_MATRICULADA'].includes(
                        asignatura.estado.toUpperCase(),
                      )
                      const disableComments =
                        disableAsignaturasValidation || !isRejectSelected || isRejectedPersisted

                      return (
                      <tr key={asignatura.id}>
                        <td>{asignatura.asignaturaCodigo ?? '—'}</td>
                        <td>{asignatura.asignaturaNombre}</td>
                        <td>{asignatura.estado}</td>
                        <td>
                          <div className="matricula-detalle__decision-group">
                            <button
                              type="button"
                              className={`matricula-detalle__decision-button matricula-detalle__decision-button--approve ${
                                currentDecision === 'APROBADA'
                                  ? 'matricula-detalle__decision-button--active'
                                  : ''
                              }`}
                              onClick={() =>
                                updateAsignaturaDecision(asignatura.id, { decision: 'APROBADA' })
                              }
                              disabled={disableAsignaturasValidation}
                            >
                              {currentDecision === 'APROBADA' ? 'Aprobada' : 'Aprobar'}
                            </button>
                            <button
                              type="button"
                              className={`matricula-detalle__decision-button matricula-detalle__decision-button--reject ${
                                isRejectSelected
                                  ? 'matricula-detalle__decision-button--active'
                                  : ''
                              }`}
                              onClick={() =>
                                updateAsignaturaDecision(asignatura.id, { decision: 'NO_MATRICULADA' })
                              }
                              disabled={disableAsignaturasValidation}
                            >
                              {isRejectSelected ? 'Rechazada' : 'Rechazar'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <textarea
                            className="matricula-detalle__asignatura-comments"
                            value={asignaturasDecision[asignatura.id]?.observaciones ?? ''}
                            onChange={(event) =>
                              updateAsignaturaDecision(asignatura.id, {
                                observaciones: event.target.value,
                              })
                            }
                            placeholder="Observaciones de validación"
                            rows={2}
                            disabled={disableComments}
                          />
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <div className="matricula-detalle__asignatura-actions">
                <button
                  type="button"
                  className="matricula-detalle__approve-button"
                  onClick={() => void handleGuardarValidacionAsignaturas()}
                  disabled={isSavingAsignaturas || disableAsignaturasValidation}
                >
                  {isSavingAsignaturas ? 'Guardando...' : 'Guardar validación de asignaturas'}
                </button>
              </div>
            </article>

          </>
        ) : null}

        {!isLoading && !matricula && !error ? (
          <p className="matricula-detalle__status">No se encontró la matrícula seleccionada.</p>
        ) : null}

        {!isLoading && !Number.isNaN(parsedMatriculaId) && !matricula ? (
          <button type="button" className="matricula-detalle__back-button" onClick={() => navigate('/matricula')}>
            Volver
          </button>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default MatriculaDetalleCoordinacionPage
