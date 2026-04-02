import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import {
  fetchSolicitudDetalle,
  updateSolicitudEstado,
} from '../../modules/solicitudes/services/solicitudesMockService'
import { fetchSolicitudDocumentos } from '../../modules/solicitudes/services/solicitudDocumentosMockService'
import DocumentosAdjuntos from '../../modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos'
import type { SolicitudCoordinadorDto } from '../../modules/solicitudes/types'
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

  const [solicitud, setSolicitud] = useState<SolicitudCoordinadorDto | null>(null)
  const [nextEstado, setNextEstado] = useState<EstadoSolicitudEditable>('EN ESTUDIO')
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
