import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { updateSolicitudEstudiante } from '../../modules/solicitudes/services/solicitudesMockService'
import { getSolicitudAcademicaById } from '../../modules/solicitudes/api/solicitudesAcademicasService'
import {
  cambiarEstadoSolicitud,
  type SolicitudEstadoTarget,
} from '../../modules/solicitudes/api/solicitudCambioEstadoService'
import { getTiposSolicitud } from '../../modules/solicitudes/api/tipoSolicitudService'
import { getSolicitudDocumentosAdjuntos } from '../../modules/solicitudes/api/solicitudDocumentosService'
import DocumentosAdjuntos from '../../modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos'
import StatusBadge from '../../modules/solicitudes/components/StatusBadge/StatusBadge'
import SolicitudDocumentosEditor, {
  type SolicitudDocumentosEditorHandle,
} from '../../modules/solicitudes/components/SolicitudDocumentosEditor/SolicitudDocumentosEditor'
import type { SolicitudAcademicaDto } from '../../modules/solicitudes/api/types'
import type { TipoSolicitudDto } from '../../modules/solicitudes/types'
import type { SolicitudDocumentoAdjuntoDto } from '../../modules/solicitudes/types/documentosAdjuntos'
import { getEstadosSolicitudCatalog } from '../../modules/solicitudes/api/estadoSolicitudService'
import { DEFAULT_ESTADOS_SOLICITUD_CATALOG, normalizeEstadoSolicitud, type EstadoSolicitudCatalogItem } from '../../modules/solicitudes/utils/estadoSolicitud'
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

const SolicitudDetallePage = () => {
  const navigate = useNavigate()
  const { solicitudId } = useParams<{ solicitudId: string }>()
  const { session } = useAuth()
  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isCoordinador = hasAnyRole(roles, ['COORDINADOR', 'ADMIN'])
  const isEstudiante = hasAnyRole(roles, ['ESTUDIANTE'])
  const usuarioSappId = session?.kind === 'SAPP' ? session.user.id : null
  const documentosEditorRef = useRef<SolicitudDocumentosEditorHandle | null>(null)

  const [solicitud, setSolicitud] = useState<SolicitudAcademicaDto | null>(null)
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [estadosCatalog, setEstadosCatalog] = useState<EstadoSolicitudCatalogItem[]>(DEFAULT_ESTADOS_SOLICITUD_CATALOG)
  const [editMode, setEditMode] = useState(false)
  const [draftTipoSolicitudId, setDraftTipoSolicitudId] = useState<number | null>(null)
  const [draftObservaciones, setDraftObservaciones] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<SolicitudDocumentoAdjuntoDto[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [estadoTarget, setEstadoTarget] = useState<SolicitudEstadoTarget>('EN_REVISION')
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)

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
        const normalizedEstado = normalizeEstadoSolicitud(response.estadoSigla || response.estado)
        setEstadoTarget(normalizedEstado === 'UNKNOWN' ? 'EN_REVISION' : normalizedEstado)
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


  useEffect(() => {
    let mounted = true

    getEstadosSolicitudCatalog()
      .then((estados) => {
        if (mounted && estados.length > 0) {
          setEstadosCatalog(estados)
        }
      })
      .catch(() => {
        // fallback al catálogo por defecto
      })

    return () => {
      mounted = false
    }
  }, [])

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

  useEffect(() => {
    if (!(isCoordinador || isEstudiante) || !solicitud) {
      setDocumentos([])
      setDocsError(null)
      setDocsLoading(false)
      return
    }

    const codigoTipoTramite = solicitud.tipoTramiteCodigo?.trim()
    if (!codigoTipoTramite) {
      setDocumentos([])
      setDocsLoading(false)
      setDocsError('No fue posible determinar el código del tipo de trámite para consultar los documentos.')
      return
    }

    void loadDocumentos(solicitud.id, codigoTipoTramite)
  }, [isCoordinador, isEstudiante, loadDocumentos, solicitud])

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
      })

      if (documentosEditorRef.current) {
        await documentosEditorRef.current.commitChanges()
      }

      setSolicitud(updated)
      setDraftTipoSolicitudId(updated.tipoSolicitudId)
      setDraftObservaciones(updated.observaciones ?? '')
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
    setFormError(null)
    setEditMode(false)
  }

  const currentEstado = normalizeEstadoSolicitud(solicitud?.estadoSigla || solicitud?.estado)
  const isSameTargetAsCurrentEstado = currentEstado !== 'UNKNOWN' && estadoTarget === currentEstado

  const handleGuardarEstado = async () => {
    if (!solicitud) {
      return
    }

    setIsUpdatingEstado(true)
    setUpdateError(null)
    setUpdateSuccess(null)

    try {
      await cambiarEstadoSolicitud(solicitud.id, estadoTarget)

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

  return (
    <ModuleLayout title="Detalle de solicitud">
      <section className="solicitud-detalle-page">
        <button
          className="solicitud-detalle-page__back"
          onClick={() => navigate('/solicitudes', { state: { refreshAt: Date.now() } })}
          type="button"
        >
          Volver
        </button>

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
                Solicitud #{solicitud.id} — {solicitud.tipoSolicitudCodigo}
              </h2>
              <p>{solicitud.tipoSolicitud}</p>
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
                  <StatusBadge estado={solicitud.estadoSigla || solicitud.estado} />
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
            </dl>

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

                    <SolicitudDocumentosEditor
                      solicitudId={solicitud.id}
                      codigoTipoTramite={solicitud.tipoTramiteCodigo?.trim() ?? ''}
                      usuarioCargaId={usuarioSappId}
                      editable={editableSolicitud}
                      onDocsCommitted={() => {
                        const codigoTipoTramite = solicitud.tipoTramiteCodigo?.trim()
                        if (codigoTipoTramite) {
                          void loadDocumentos(solicitud.id, codigoTipoTramite)
                        }
                      }}
                    />
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

            {isCoordinador && !isEstudiante && (
              <>
                <section className="solicitud-detalle-page__estado-editor">
                  <h3>Cambiar estado</h3>
                  <div className="solicitud-detalle-page__estado-controls">
                    <select
                      value={estadoTarget}
                      onChange={(event) => {
                        setEstadoTarget(event.target.value as SolicitudEstadoTarget)
                        setUpdateError(null)
                        setUpdateSuccess(null)
                      }}
                    >
                      {estadosCatalog.map((estado) => (
                        <option key={estado.id} value={estado.sigla}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="solicitud-detalle-page__save"
                      type="button"
                      onClick={handleGuardarEstado}
                      disabled={isUpdatingEstado || isSameTargetAsCurrentEstado}
                    >
                      {isUpdatingEstado ? 'Guardando...' : 'Guardar estado'}
                    </button>
                  </div>
                  {updateError && (
                    <p className="solicitud-detalle-page__status solicitud-detalle-page__status--error">{updateError}</p>
                  )}
                  {updateSuccess && <p className="solicitud-detalle-page__success">{updateSuccess}</p>}
                </section>

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
              </>
            )}
          </>
        )}
      </section>
    </ModuleLayout>
  )
}

export default SolicitudDetallePage
