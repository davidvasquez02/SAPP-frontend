import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { BackButton, ModuleLayout } from '../../components'
import { canManagePosgrados, hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { updateSolicitudEstudiante } from '../../modules/solicitudes/services/solicitudesMockService'
import {
  firmarDocumentosSolicitudAcademica,
  getSolicitudAcademicaById,
} from '../../modules/solicitudes/api/solicitudesAcademicasService'
import {
  cambiarEstadoSolicitud,
  type SolicitudEstadoTarget,
} from '../../modules/solicitudes/api/solicitudCambioEstadoService'
import { getTiposSolicitud } from '../../modules/solicitudes/api/tipoSolicitudService'
import { getSolicitudDocumentosAdjuntos } from '../../modules/solicitudes/api/solicitudDocumentosService'
import { getActas } from '../../modules/actas/api'
import type { ActaDto } from '../../modules/actas/types'
import DocumentosAdjuntos from '../../modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos'
import StatusBadge from '../../modules/solicitudes/components/StatusBadge/StatusBadge'
import SolicitudDocumentosEditor, {
  type SolicitudDocumentosEditorHandle,
} from '../../modules/solicitudes/components/SolicitudDocumentosEditor/SolicitudDocumentosEditor'
import type { SolicitudAcademicaDto } from '../../modules/solicitudes/api/types'
import type { TipoSolicitudDto } from '../../modules/solicitudes/types'
import type { SolicitudDocumentoAdjuntoDto } from '../../modules/solicitudes/types/documentosAdjuntos'
import { normalizeEstadoSolicitud } from '../../modules/solicitudes/utils/estadoSolicitud'
import { isTipoCreditoCondonable } from '../../modules/solicitudes/utils/creditoCondonable'
import './SolicitudDetallePage.css'

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

const formatDate = (value: string | null) => {
  if (!value) {
    return '—'
  }

  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const getTipoSolicitudCode = (tipo: TipoSolicitudDto | undefined) =>
  tipo?.codigoNombre?.split(' - ', 1)[0]?.trim().toLocaleUpperCase() ?? ''

const SolicitudDetallePage = () => {
  const location = useLocation()
  const { solicitudId } = useParams<{ solicitudId: string }>()
  const { session } = useAuth()
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isCoordinador = canManagePosgrados(roles)
  const isEstudiante = hasAnyRole(roles, ['ESTUDIANTE'])
  const usuarioSappId = session?.kind === 'SAPP' ? session.user.id : null
  const documentosEditorRef = useRef<SolicitudDocumentosEditorHandle | null>(null)

  const [solicitud, setSolicitud] = useState<SolicitudAcademicaDto | null>(null)
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [editMode, setEditMode] = useState(false)
  const [draftTipoSolicitudId, setDraftTipoSolicitudId] = useState<number | null>(null)
  const [draftObservaciones, setDraftObservaciones] = useState('')
  const [draftMotivosCredito, setDraftMotivosCredito] = useState<string[]>([''])
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<SolicitudDocumentoAdjuntoDto[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [showConsejoConfirmation, setShowConsejoConfirmation] = useState(false)
  const [showActaSelection, setShowActaSelection] = useState(false)
  const [actas, setActas] = useState<ActaDto[]>([])
  const [selectedActaId, setSelectedActaId] = useState('')
  const [actasLoading, setActasLoading] = useState(false)
  const [actasError, setActasError] = useState<string | null>(null)
  const [pendingEnviarConsejo, setPendingEnviarConsejo] = useState<boolean | undefined>()
  const [isSigning, setIsSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
  const [signSuccess, setSignSuccess] = useState<string | null>(null)

  useEffect(() => {
    const parsedId = Number(solicitudId ?? '')
    if (Number.isNaN(parsedId)) {
      setError('ID inválido')
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    setError(null)

    getSolicitudAcademicaById(parsedId)
      .then((response) => {
        if (!mounted) {
          return
        }
        setSolicitud(response)
        setDraftTipoSolicitudId(response.tipoSolicitudId)
        setDraftObservaciones(response.observaciones ?? '')
        setDraftMotivosCredito(response.motivosCreditoCondonable?.length ? response.motivosCreditoCondonable : [''])
        setEditMode(false)
      })
      .catch((fetchError) => {
        if (!mounted) {
          return
        }
        setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar la solicitud.')
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [solicitudId])

  useEffect(() => {
    if (!isEstudiante) {
      setTiposSolicitud([])
      return
    }

    let mounted = true
    getTiposSolicitud()
      .then((tipos) => {
        if (mounted) {
          setTiposSolicitud(tipos)
        }
      })
      .catch(() => {
        if (mounted) {
          setTiposSolicitud([])
        }
      })

    return () => {
      mounted = false
    }
  }, [isEstudiante])

  const loadDocumentos = useCallback(async (tramiteId: number, codigoTipoTramite: string) => {
    setDocsLoading(true)
    setDocsError(null)

    try {
      const response = await getSolicitudDocumentosAdjuntos({ tramiteId, codigoTipoTramite })
      setDocumentos(response)
    } catch (documentsError) {
      setDocsError(
        documentsError instanceof Error ? documentsError.message : 'No fue posible cargar los documentos adjuntos.',
      )
    } finally {
      setDocsLoading(false)
    }
  }, [])

  const solicitudTramiteId = solicitud?.id
  const codigoTipoTramite = solicitud?.tipoTramiteCodigo?.trim()

  useEffect(() => {
    if (solicitudTramiteId == null) {
      setDocumentos([])
      setDocsError(null)
      setDocsLoading(false)
      return
    }

    if (!codigoTipoTramite) {
      setDocumentos([])
      setDocsLoading(false)
      setDocsError('No fue posible determinar el código del tipo de trámite para consultar los documentos.')
      return
    }

    void loadDocumentos(solicitudTramiteId, codigoTipoTramite)
  }, [codigoTipoTramite, loadDocumentos, solicitudTramiteId])

  const editableSolicitud =
    isEstudiante &&
    ['ENVIADA', 'EN_REVISION', 'DEVUELTA', 'RECHAZADA'].includes(
      normalizeEstadoSolicitud(solicitud?.estadoSigla || solicitud?.estado),
    )

  const handleGuardarEdicion = async () => {
    if (!solicitud || draftTipoSolicitudId == null) {
      setFormError('Debes seleccionar un tipo de solicitud.')
      return
    }

    setSaving(true)
    setError(null)
    setFormError(null)
    setSuccessMessage(null)

    try {
      const updated = await updateSolicitudEstudiante(solicitud.id, {
        tipoSolicitudId: draftTipoSolicitudId,
        observaciones: draftObservaciones.trim(),
        motivosCreditoCondonable: showDraftMotivosCredito
          ? draftMotivosCredito.map((item) => item.trim()).filter(Boolean)
          : [],
      })

      if (documentosEditorRef.current) {
        await documentosEditorRef.current.commitChanges()
      }

      setSolicitud(updated)
      setDraftTipoSolicitudId(updated.tipoSolicitudId)
      setDraftObservaciones(updated.observaciones ?? '')
      setDraftMotivosCredito(updated.motivosCreditoCondonable?.length ? updated.motivosCreditoCondonable : [''])
      setEditMode(false)
      setSuccessMessage('Cambios guardados (mock)')
      const codigoTipoTramite = updated.tipoTramiteCodigo?.trim()
      if (codigoTipoTramite) {
        await loadDocumentos(updated.id, codigoTipoTramite)
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelarEdicion = () => {
    if (!solicitud) {
      return
    }
    setDraftTipoSolicitudId(solicitud.tipoSolicitudId)
    setDraftObservaciones(solicitud.observaciones ?? '')
    setDraftMotivosCredito(solicitud.motivosCreditoCondonable?.length ? solicitud.motivosCreditoCondonable : [''])
    setFormError(null)
    setEditMode(false)
  }


  const updateDraftMotivo = (index: number, value: string) => {
    setDraftMotivosCredito((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  const addDraftMotivo = () => {
    setDraftMotivosCredito((current) => [...current, ''])
  }

  const removeDraftMotivo = (index: number) => {
    setDraftMotivosCredito((current) => (current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current))
  }

  const currentEstado = normalizeEstadoSolicitud(solicitud?.estadoSigla || solicitud?.estado)
  const estadoAntesDeResolver = `${solicitud?.estadoSigla ?? ''} ${solicitud?.estado ?? ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
  const estabaEnConsejo = estadoAntesDeResolver.includes('CONSEJO')
  const estabaEnInstanciaResolutiva =
    currentEstado === 'ENVIADA' || estadoAntesDeResolver.includes('COMITE') || estabaEnConsejo
  const showMotivosCredito = isTipoCreditoCondonable(solicitud?.tipoSolicitudCodigo)
  const draftTipoSolicitud = tiposSolicitud.find((tipo) => tipo.id === draftTipoSolicitudId)
  const showDraftMotivosCredito = draftTipoSolicitud
    ? isTipoCreditoCondonable(getTipoSolicitudCode(draftTipoSolicitud))
    : draftTipoSolicitudId === solicitud?.tipoSolicitudId && showMotivosCredito
  const canResolveSolicitud = isCoordinador && estabaEnInstanciaResolutiva
  const estadoPermiteFirma = [solicitud?.estado, solicitud?.estadoSigla].some((estado) =>
    estado?.trim().toLocaleUpperCase().includes('POR FIRMA'),
  )
  const canSignAllDocuments = isCoordinador && estadoPermiteFirma

  const handleFirmarDocumentos = async () => {
    if (!solicitud) {
      return
    }

    let firmaCompletada = false
    setIsSigning(true)
    setSignError(null)
    setSignSuccess(null)

    try {
      await firmarDocumentosSolicitudAcademica(solicitud.id)
      firmaCompletada = true
      setDocsLoading(true)
      setDocsError(null)

      const solicitudActualizada = await getSolicitudAcademicaById(solicitud.id)
      const codigoTipoTramiteActualizado = solicitudActualizada.tipoTramiteCodigo?.trim()

      if (!codigoTipoTramiteActualizado) {
        throw new Error('No fue posible determinar el tipo de trámite para actualizar los documentos.')
      }

      const documentosActualizados = await getSolicitudDocumentosAdjuntos({
        tramiteId: solicitudActualizada.id,
        codigoTipoTramite: codigoTipoTramiteActualizado,
      })

      setSolicitud(solicitudActualizada)
      setDocumentos(documentosActualizados)
      setSignSuccess('Todos los documentos fueron firmados y la información fue actualizada correctamente.')
    } catch (signingError) {
      setSignError(
        firmaCompletada
          ? getErrorMessage(
            signingError,
            'Los documentos fueron firmados, pero no fue posible actualizar la información en pantalla.',
          )
          : getErrorMessage(signingError, 'No fue posible firmar los documentos de la solicitud.'),
      )
    } finally {
      setDocsLoading(false)
      setIsSigning(false)
    }
  }

  const isSolicitudOtra = solicitud?.tipoSolicitudId === 11

  const handleResolverSolicitud = async (
    target: Extract<SolicitudEstadoTarget, 'APROBADA' | 'RECHAZADA'>,
    enviarConsejo?: boolean,
    actaId?: number,
  ) => {
    if (!solicitud || !canResolveSolicitud) {
      return
    }

    setIsUpdatingEstado(true)
    setUpdateError(null)
    setUpdateSuccess(null)

    try {
      await cambiarEstadoSolicitud(solicitud.id, target, { enviarConsejo, actaId })

      try {
        const refreshed = await getSolicitudAcademicaById(solicitud.id)
        setSolicitud(refreshed)
        setUpdateSuccess('Estado actualizado correctamente')
      } catch {
        setUpdateError('Estado actualizado pero no se pudo recargar el detalle')
      }
    } catch (updateEstadoError) {
      setUpdateError(getErrorMessage(updateEstadoError, 'No fue posible actualizar el estado de la solicitud.'))
    } finally {
      setIsUpdatingEstado(false)
    }
  }

  const openActaSelection = async (enviarConsejo?: boolean) => {
    setPendingEnviarConsejo(enviarConsejo)
    setSelectedActaId('')
    setActas([])
    setActasError(null)
    setShowActaSelection(true)
    setActasLoading(true)

    try {
      const response = await getActas()
      setActas(
        response.filter((acta) =>
          estabaEnConsejo ? acta.tipoConsejo === true : (acta.tipoConsejo === null || acta.tipoConsejo === false),
        ),
      )
    } catch (actasFetchError) {
      setActasError(getErrorMessage(actasFetchError, 'No fue posible consultar las actas disponibles.'))
    } finally {
      setActasLoading(false)
    }
  }

  const handleApproveClick = () => {
    if (isSolicitudOtra) {
      setShowConsejoConfirmation(true)
      return
    }

    void openActaSelection()
  }

  const handleConsejoDecision = (enviarConsejo: boolean) => {
    setShowConsejoConfirmation(false)
    void openActaSelection(enviarConsejo)
  }

  const handleConfirmApproval = () => {
    const actaId = Number(selectedActaId)
    if (!Number.isInteger(actaId) || actaId <= 0) {
      setActasError('Debes seleccionar el acta asociada a la aprobación.')
      return
    }

    setShowActaSelection(false)
    void handleResolverSolicitud('APROBADA', pendingEnviarConsejo, actaId)
  }

  return (
    <ModuleLayout title="Detalle de solicitud">
      <section className="solicitud-detalle-page">
        <BackButton
          to={location.pathname.startsWith('/creditos-condonables') ? '/creditos-condonables' : '/solicitudes'}
          state={{ refreshAt: Date.now() }}
        >
          Volver a {location.pathname.startsWith('/creditos-condonables') ? 'créditos condonables' : 'solicitudes'}
        </BackButton>

        {loading ? (
          <p className="solicitud-detalle-page__status">Cargando solicitud...</p>
        ) : error ? (
          <p className="solicitud-detalle-page__status solicitud-detalle-page__status--error">{error}</p>
        ) : !solicitud ? (
          <p className="solicitud-detalle-page__status">Solicitud no encontrada.</p>
        ) : (
          <>
            <header className="solicitud-detalle-page__header">
              <h2>
                Solicitud {solicitud.id} — {solicitud.tipoSolicitud}
              </h2>
            </header>

            <dl className="solicitud-detalle-page__grid">
              <div className="solicitud-detalle-page__item">
                <dt>Estudiante</dt>
                <dd>
                  {solicitud.estudiante} ({solicitud.codigoEstudianteUis})
                </dd>
              </div>
              <div className="solicitud-detalle-page__item">
                <dt>Programa académico</dt>
                <dd>{solicitud.programaAcademico}</dd>
              </div>
              <div className="solicitud-detalle-page__item">
                <dt>Estado</dt>
                <dd>
                  <StatusBadge
                    estado={solicitud.estadoSigla || solicitud.estado}
                    programaAcademico={solicitud.programaAcademico}
                  />
                </dd>
              </div>
              <div className="solicitud-detalle-page__item">
                <dt>Fecha registro</dt>
                <dd>{formatDate(solicitud.fechaRegistro)}</dd>
              </div>
              <div className="solicitud-detalle-page__item">
                <dt>Fecha resolución</dt>
                <dd>{formatDate(solicitud.fechaResolucion)}</dd>
              </div>
              <div className="solicitud-detalle-page__item solicitud-detalle-page__item--full">
                <dt>Observaciones</dt>
                <dd>{solicitud.observaciones || 'Sin observaciones.'}</dd>
              </div>
              {showMotivosCredito && (
                <div className="solicitud-detalle-page__item solicitud-detalle-page__item--full">
                  <dt>Motivos para la solicitud del crédito condonable</dt>
                  <dd>
                    {solicitud.motivosCreditoCondonable?.length ? (
                      <ul className="solicitud-detalle-page__motivos-list">
                        {solicitud.motivosCreditoCondonable.map((motivo, index) => (
                          <li key={`${motivo}-${index}`}>{motivo}</li>
                        ))}
                      </ul>
                    ) : (
                      'Sin motivos registrados.'
                    )}
                  </dd>
                </div>
              )}
            </dl>

            {solicitud.tipoSolicitudCodigo?.trim().toLocaleUpperCase() === 'HOMOLOG' && (
              <section className="solicitud-detalle-page__homologaciones" aria-labelledby="homologaciones-title">
                <h3 id="homologaciones-title">Materias solicitadas para homologación</h3>
                {solicitud.solicitudHomologacionesAsignaturas?.length ? (
                  <div className="solicitud-detalle-page__table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Materia de origen</th>
                          <th scope="col">Materia de destino</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solicitud.solicitudHomologacionesAsignaturas.map((homologacion) => (
                          <tr key={homologacion.id}>
                            <td>
                              <strong>{homologacion.asignaturaOrigenNombre}</strong>
                              <span>{homologacion.asignaturaOrigenCodigo || 'Sin código'}</span>
                            </td>
                            <td>
                              <strong>{homologacion.asignaturaDestinoNombre}</strong>
                              <span>{homologacion.asignaturaDestinoCodigo || 'Sin código'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No hay materias de homologación registradas.</p>
                )}
              </section>
            )}

            {(canSignAllDocuments || signError || signSuccess) && (
              <section className="solicitud-detalle-page__signature-actions">
                {canSignAllDocuments && (
                  <button
                    className="solicitud-detalle-page__save"
                    type="button"
                    onClick={handleFirmarDocumentos}
                    disabled={isSigning}
                  >
                    {isSigning ? 'Firmando documentos...' : 'Firmar todos los documentos'}
                  </button>
                )}
                {signError && (
                  <p className="solicitud-detalle-page__status solicitud-detalle-page__status--error" role="alert">
                    {signError}
                  </p>
                )}
                {signSuccess && <p className="solicitud-detalle-page__success">{signSuccess}</p>}
              </section>
            )}

            {isEstudiante && (
              <section className="solicitud-detalle-page__estado-editor">
                {!editMode ? (
                  <>
                    {editableSolicitud && (
                      <button
                        className="solicitud-detalle-page__save"
                        type="button"
                        onClick={() => {
                          setEditMode(true)
                          setSuccessMessage(null)
                          setFormError(null)
                        }}
                      >
                        Editar solicitud
                      </button>
                    )}

                  </>
                ) : (
                  <div className="solicitud-detalle-page__student-editor">
                    <h3>Editar solicitud</h3>
                    <label className="solicitud-detalle-page__field">
                      <span>Tipo de solicitud</span>
                      <select
                        value={draftTipoSolicitudId ?? ''}
                        onChange={(event) => {
                          setDraftTipoSolicitudId(Number(event.target.value))
                          setFormError(null)
                        }}
                      >
                        <option value="" disabled>
                          Selecciona un tipo
                        </option>
                        {tiposSolicitud.map((tipo) => (
                          <option key={tipo.id} value={tipo.id}>
                            {tipo.codigoNombre}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="solicitud-detalle-page__field">
                      <span>Observaciones</span>
                      <textarea
                        rows={4}
                        value={draftObservaciones}
                        onChange={(event) => setDraftObservaciones(event.target.value)}
                      />
                    </label>
                    {showDraftMotivosCredito && <div className="solicitud-detalle-page__field">
                      <span>Motivos para la solicitud del crédito condonable</span>
                      {draftMotivosCredito.map((motivo, index) => (
                        <div key={`edit-motivo-${index}`} className="solicitud-detalle-page__motivo-row">
                          <input value={motivo} onChange={(event) => updateDraftMotivo(index, event.target.value)} />
                          <button type="button" className="solicitud-detalle-page__back" onClick={() => removeDraftMotivo(index)} disabled={draftMotivosCredito.length === 1}>−</button>
                        </div>
                      ))}
                      <button type="button" className="solicitud-detalle-page__back" onClick={addDraftMotivo}>+ Agregar motivo</button>
                    </div>}

                    {draftTipoSolicitudId && (
                      <SolicitudDocumentosEditor
                        ref={documentosEditorRef}
                        solicitudId={solicitud.id}
                        codigoTipoTramite={solicitud.tipoTramiteCodigo?.trim() ?? ''}
                        usuarioCargaId={usuarioSappId}
                        editable={editableSolicitud}
                        showSaveButton={false}
                        onDocsCommitted={() => {
                          const codigoTipoTramite = solicitud.tipoTramiteCodigo?.trim()
                          if (codigoTipoTramite) {
                            void loadDocumentos(solicitud.id, codigoTipoTramite)
                          }
                        }}
                      />
                    )}

                    {formError && <p className="solicitud-detalle-page__status solicitud-detalle-page__status--error">{formError}</p>}

                    <div className="solicitud-detalle-page__estado-controls">
                      <button className="solicitud-detalle-page__save" type="button" onClick={handleGuardarEdicion} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      <button className="solicitud-detalle-page__back" type="button" onClick={handleCancelarEdicion} disabled={saving}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                {successMessage && <p className="solicitud-detalle-page__success">{successMessage}</p>}
              </section>
            )}

            {(canResolveSolicitud || updateError || updateSuccess) && (
              <>
                <section className="solicitud-detalle-page__estado-editor">
                  {canResolveSolicitud && (
                    <>
                      <h3>Resolver solicitud</h3>
                      <div className="solicitud-detalle-page__estado-controls">
                        <button
                          className="solicitud-detalle-page__decision solicitud-detalle-page__decision--approve"
                          type="button"
                          onClick={handleApproveClick}
                          disabled={isUpdatingEstado}
                        >
                          {isUpdatingEstado ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                          className="solicitud-detalle-page__decision solicitud-detalle-page__decision--reject"
                          type="button"
                          onClick={() => void handleResolverSolicitud('RECHAZADA')}
                          disabled={isUpdatingEstado}
                        >
                          {isUpdatingEstado ? 'Procesando...' : 'Rechazar'}
                        </button>
                      </div>
                    </>
                  )}
                  {updateError && (
                    <p className="solicitud-detalle-page__status solicitud-detalle-page__status--error">{updateError}</p>
                  )}
                  {updateSuccess && <p className="solicitud-detalle-page__success">{updateSuccess}</p>}
                </section>

              </>
            )}

            <DocumentosAdjuntos
              documentos={documentos}
              isLoading={docsLoading}
              error={docsError}
              onRetry={() => {
                const codigoTipoTramite = solicitud.tipoTramiteCodigo?.trim()
                if (codigoTipoTramite) {
                  void loadDocumentos(solicitud.id, codigoTipoTramite)
                }
              }}
            />

            {showConsejoConfirmation && (
              <div
                className="solicitud-detalle-page__modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="consejo-confirmation-title"
              >
                <button
                  className="solicitud-detalle-page__modal-backdrop"
                  type="button"
                  aria-label="Cancelar aprobación"
                  onClick={() => setShowConsejoConfirmation(false)}
                />
                <div className="solicitud-detalle-page__modal-dialog">
                  <h3 id="consejo-confirmation-title">¿Requiere aprobación del Consejo Académico?</h3>
                  <p>
                    Indica si esta solicitud de tipo OTRA debe enviarse al Consejo Académico antes de continuar.
                  </p>
                  <div className="solicitud-detalle-page__modal-actions">
                    <button
                      className="solicitud-detalle-page__decision solicitud-detalle-page__decision--approve"
                      type="button"
                      onClick={() => handleConsejoDecision(true)}
                    >
                      Sí, enviar al Consejo
                    </button>
                    <button
                      className="solicitud-detalle-page__save"
                      type="button"
                      onClick={() => handleConsejoDecision(false)}
                    >
                      No, aprobar directamente
                    </button>
                    <button
                      className="solicitud-detalle-page__back"
                      type="button"
                      onClick={() => setShowConsejoConfirmation(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showActaSelection && (
              <div
                className="solicitud-detalle-page__modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="acta-selection-title"
              >
                <button
                  className="solicitud-detalle-page__modal-backdrop"
                  type="button"
                  aria-label="Cancelar aprobación"
                  onClick={() => setShowActaSelection(false)}
                />
                <div className="solicitud-detalle-page__modal-dialog">
                  <h3 id="acta-selection-title">Seleccionar acta asociada</h3>
                  <p>
                    La solicitud estaba en {estabaEnConsejo ? 'Consejo Académico' : 'Comité Asesor de Posgrados'}.
                    Selecciona un acta de esa instancia para registrar la aprobación.
                  </p>

                  {actasLoading ? (
                    <p role="status">Consultando actas...</p>
                  ) : (
                    <label className="solicitud-detalle-page__field">
                      <span>Acta *</span>
                      <select
                        value={selectedActaId}
                        onChange={(event) => {
                          setSelectedActaId(event.target.value)
                          setActasError(null)
                        }}
                        disabled={actas.length === 0}
                      >
                        <option value="">Selecciona un acta</option>
                        {actas.map((acta) => (
                          <option key={acta.id} value={acta.id}>
                            {acta.codigo} — {acta.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {!actasLoading && actas.length === 0 && !actasError && (
                    <p className="solicitud-detalle-page__status solicitud-detalle-page__status--error" role="alert">
                      No hay actas disponibles para esta instancia.
                    </p>
                  )}
                  {actasError && (
                    <p className="solicitud-detalle-page__status solicitud-detalle-page__status--error" role="alert">
                      {actasError}
                    </p>
                  )}

                  <div className="solicitud-detalle-page__modal-actions">
                    <button
                      className="solicitud-detalle-page__decision solicitud-detalle-page__decision--approve"
                      type="button"
                      onClick={handleConfirmApproval}
                      disabled={actasLoading || !selectedActaId}
                    >
                      Aprobar con acta
                    </button>
                    <button
                      className="solicitud-detalle-page__back"
                      type="button"
                      onClick={() => setShowActaSelection(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </ModuleLayout>
  )
}

export default SolicitudDetallePage
