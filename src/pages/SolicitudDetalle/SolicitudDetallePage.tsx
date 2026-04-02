import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import {
  fetchSolicitudDetalle,
  fetchTiposSolicitud,
  updateSolicitudEstudiante,
  updateSolicitudEstado,
} from '../../modules/solicitudes/services/solicitudesMockService'
import { fetchSolicitudDocumentos } from '../../modules/solicitudes/services/solicitudDocumentosMockService'
import DocumentosAdjuntos from '../../modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos'
import type { SolicitudCoordinadorDto } from '../../modules/solicitudes/types'
import type { TipoSolicitudDto } from '../../modules/solicitudes/types'
import type { EstadoSolicitudEditable } from '../../modules/solicitudes/mock/solicitudesStore.mock'
import type { SolicitudDocumentoAdjuntoDto } from '../../modules/solicitudes/types/documentosAdjuntos'
import './SolicitudDetallePage.css'

const ESTADOS_EDITABLES: EstadoSolicitudEditable[] = ['EN ESTUDIO', 'APROBADA', 'RECHAZADA']

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
  const isEstudiante = !isCoordinador && hasAnyRole(roles, ['ESTUDIANTE'])

  const [solicitud, setSolicitud] = useState<SolicitudCoordinadorDto | null>(null)
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [nextEstado, setNextEstado] = useState<EstadoSolicitudEditable>('EN ESTUDIO')
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

  useEffect(() => {
    const parsedId = Number(solicitudId)

    if (!parsedId) {
      setError('Solicitud no encontrada')
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    setError(null)

    fetchSolicitudDetalle(parsedId)
      .then((response) => {
        if (!mounted) {
          return
        }
        setSolicitud(response)
        setDraftTipoSolicitudId(response.tipoSolicitudId)
        setDraftObservaciones(response.observaciones ?? '')
        setEditMode(false)
        if (ESTADOS_EDITABLES.includes(response.estadoSigla as EstadoSolicitudEditable)) {
          setNextEstado(response.estadoSigla as EstadoSolicitudEditable)
        }
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
    fetchTiposSolicitud()
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

  const loadDocumentos = useCallback(async (parsedId: number) => {
    setDocsLoading(true)
    setDocsError(null)

    try {
      const response = await fetchSolicitudDocumentos(parsedId)
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
    const parsedId = Number(solicitudId)

    if (!isCoordinador || !parsedId) {
      setDocumentos([])
      setDocsError(null)
      setDocsLoading(false)
      return
    }

    void loadDocumentos(parsedId)
  }, [isCoordinador, loadDocumentos, solicitudId])

  const handleSaveEstado = async () => {
    if (!solicitud) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const updated = await updateSolicitudEstado(solicitud.id, nextEstado)
      setSolicitud(updated)
      setNextEstado(updated.estadoSigla as EstadoSolicitudEditable)
      setSuccessMessage('Estado actualizado correctamente')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible actualizar el estado.')
    } finally {
      setSaving(false)
    }
  }

  const editableByEstudiante =
    isEstudiante &&
    (solicitud?.estadoSigla === 'REGISTRADA' || solicitud?.estadoSigla === 'EN ESTUDIO')

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
      setSolicitud(updated)
      setDraftTipoSolicitudId(updated.tipoSolicitudId)
      setDraftObservaciones(updated.observaciones ?? '')
      setEditMode(false)
      setSuccessMessage('Cambios guardados (mock)')
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

  return (
    <ModuleLayout title="Detalle de solicitud">
      <section className="solicitud-detalle-page">
        <button className="solicitud-detalle-page__back" onClick={() => navigate('/solicitudes')} type="button">
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
                  <span className="solicitud-detalle-page__badge">{solicitud.estadoSigla}</span>
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
                    {editableByEstudiante && (
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

            {isCoordinador && (
              <>
                <section className="solicitud-detalle-page__estado-editor">
                  <h3>Cambiar estado</h3>
                  <div className="solicitud-detalle-page__estado-controls">
                    <select
                      value={nextEstado}
                      onChange={(event) => {
                        setNextEstado(event.target.value as EstadoSolicitudEditable)
                        setSuccessMessage(null)
                      }}
                    >
                      {ESTADOS_EDITABLES.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                    <button
                      className="solicitud-detalle-page__save"
                      onClick={handleSaveEstado}
                      type="button"
                      disabled={saving || solicitud.estadoSigla === nextEstado}
                    >
                      {saving ? 'Guardando...' : 'Guardar estado'}
                    </button>
                  </div>
                  {successMessage && <p className="solicitud-detalle-page__success">{successMessage}</p>}
                </section>

                <DocumentosAdjuntos
                  documentos={documentos}
                  isLoading={docsLoading}
                  error={docsError}
                  onRetry={() => {
                    const parsedId = Number(solicitudId)
                    if (parsedId) {
                      void loadDocumentos(parsedId)
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
