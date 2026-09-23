import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../context/Auth'
import { BackButton } from '../../../../components'
import { uploadDocument } from '../../../../api/documentUploadService'
import { fileToBase64 } from '../../../../utils/fileToBase64'
import { sha256Hex } from '../../../../utils/sha256'
import SolicitudEstudianteForm, {
  type SolicitudEstudiantePayload,
} from '../SolicitudEstudianteForm/SolicitudEstudianteForm'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import {
  createSolicitudAcademica,
  getSolicitudesAcademicasByEstudiante,
  previsualizarSolicitudCredito,
} from '../../api/solicitudesAcademicasService'
import { getTiposSolicitud } from '../../api/tipoSolicitudService'
import { getEstadosSolicitudCatalog } from '../../api/estadoSolicitudService'
import type { SolicitudEstudianteRowDto, SolicitudTableRow, TipoSolicitudDto } from '../../types'
import {
  DEFAULT_ESTADOS_SOLICITUD_CATALOG,
  getEstadosPresentesEnSolicitudes,
  normalizeEstadoSolicitud,
  type EstadoSolicitudCatalogItem,
} from '../../utils/estadoSolicitud'
import SolicitudesFiltersBar from '../SolicitudesFiltersBar/SolicitudesFiltersBar'
import { compareSolicitudesDesc } from '../../utils/ordenSolicitudes'
import './SolicitudesEstudianteView.css'

const PAGE_SIZE = 10
const identityTipoSolicitud = (tipo: TipoSolicitudDto) => tipo

interface SolicitudesEstudianteViewProps {
  includeTipoSolicitudIds?: readonly number[]
  excludeTipoSolicitudIds?: ReadonlySet<number>
  detailPath?: (solicitudId: number) => string
  transformTipoSolicitud?: (tipo: TipoSolicitudDto) => TipoSolicitudDto
  filterSolicitud?: (solicitud: SolicitudTableRow) => boolean
  showAllEstadoOptions?: boolean
}

const SolicitudesEstudianteView = ({
  includeTipoSolicitudIds,
  excludeTipoSolicitudIds,
  detailPath = (solicitudId) => `/solicitudes/${solicitudId}`,
  transformTipoSolicitud = identityTipoSolicitud,
  filterSolicitud,
  showAllEstadoOptions = false,
}: SolicitudesEstudianteViewProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const estudianteId =
    session && session.kind === 'SAPP' && 'estudiante' in session.user
      ? session.user.estudiante?.id ?? null
      : null
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST')
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [rows, setRows] = useState<SolicitudEstudianteRowDto[]>([])
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null)
  const [estadosCatalog, setEstadosCatalog] = useState<EstadoSolicitudCatalogItem[]>(DEFAULT_ESTADOS_SOLICITUD_CATALOG)
  const [loading, setLoading] = useState(true)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const usuarioSappId = session && session.kind === 'SAPP' ? session.user.id : null
  const telefonoEstudiante = session?.user.persona.telefono ?? ''
  const correoEstudiante =
    session?.user.persona.emailInstitucional ?? session?.user.email ?? session?.user.persona.emailPersonal ?? ''

  const loadSolicitudes = useCallback(async (targetEstudianteId: number) => {
    const solicitudes = await getSolicitudesAcademicasByEstudiante(targetEstudianteId)
    setRows(
      solicitudes.filter((solicitud) => {
        if (includeTipoSolicitudIds && !includeTipoSolicitudIds.includes(solicitud.tipoSolicitudId)) {
          return false
        }
        if (filterSolicitud && !filterSolicitud(solicitud)) return false
        return !excludeTipoSolicitudIds?.has(solicitud.tipoSolicitudId)
      }),
    )
  }, [excludeTipoSolicitudIds, filterSolicitud, includeTipoSolicitudIds])

  useEffect(() => {
    let mounted = true

    if (estudianteId === null) {
      setLoading(false)
      setError('No hay estudianteId en sesión')
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    setError(null)

    loadSolicitudes(estudianteId).catch((fetchError) => {
      if (!mounted) {
        return
      }
      setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar tus solicitudes.')
    })
      .finally(() => {
        if (!mounted) {
          return
        }
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [estudianteId, loadSolicitudes, location.key])

  useEffect(() => {
    let mounted = true

    Promise.all([getTiposSolicitud(), getEstadosSolicitudCatalog()])
      .then(([tipos, estados]) => {
        if (!mounted) {
          return
        }

        setTiposSolicitud(
          tipos.filter((tipo) => {
            if (includeTipoSolicitudIds && !includeTipoSolicitudIds.includes(tipo.id)) {
              return false
            }
            return !excludeTipoSolicitudIds?.has(tipo.id)
          }).map(transformTipoSolicitud),
        )
        if (estados.length > 0) {
          setEstadosCatalog(estados)
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setCatalogError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar filtros de solicitudes.')
        }
      })

    return () => {
      mounted = false
    }
  }, [excludeTipoSolicitudIds, includeTipoSolicitudIds, transformTipoSolicitud])

  useEffect(() => {
    if (viewMode !== 'FORM') {
      return
    }

    let mounted = true
    setLoadingTipos(true)
    setFormError(null)

    getTiposSolicitud()
      .then((tipos) => {
        if (mounted) {
          setTiposSolicitud(
            tipos.filter((tipo) => {
              if (includeTipoSolicitudIds && !includeTipoSolicitudIds.includes(tipo.id)) {
                return false
              }
              return !excludeTipoSolicitudIds?.has(tipo.id)
            }).map(transformTipoSolicitud),
          )
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setFormError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar tipos de solicitud.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingTipos(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [excludeTipoSolicitudIds, includeTipoSolicitudIds, transformTipoSolicitud, viewMode])

  const handleRegisterSolicitud = async (payload: SolicitudEstudiantePayload) => {
    if (estudianteId === null || usuarioSappId === null) {
      setFormError('No hay información de usuario en sesión')
      return
    }

    try {
      setSaving(true)
      setFormError(null)
      setFormSuccess(null)
      const existingIds = new Set(rows.map((row) => row.id))

      const createdSolicitud = await createSolicitudAcademica({
        estudianteId,
        tipoSolicitudId: payload.tipoSolicitudId,
        tituloTrabajo: payload.tituloTrabajo,
        resumenTrabajo: payload.resumenTrabajo,
        fechaResolucion: null,
        observaciones: payload.observaciones || '',
        modalidadId: payload.modalidadId ?? undefined,
        motivosCreditoCondonable:
          payload.motivosCreditoCondonable.length > 0 ? payload.motivosCreditoCondonable : undefined,
        solicitudHomologacionesAsignaturas:
          payload.solicitudHomologacionesAsignaturas.length > 0
            ? payload.solicitudHomologacionesAsignaturas
            : undefined,
      })

      const refreshedSolicitudes = await getSolicitudesAcademicasByEstudiante(estudianteId)
      setRows(
        refreshedSolicitudes.filter((solicitud) => {
          if (includeTipoSolicitudIds && !includeTipoSolicitudIds.includes(solicitud.tipoSolicitudId)) return false
          if (filterSolicitud && !filterSolicitud(solicitud)) return false
          return !excludeTipoSolicitudIds?.has(solicitud.tipoSolicitudId)
        }),
      )
      setCurrentPage(1)

      const inferredSolicitudId =
        createdSolicitud?.id ??
        refreshedSolicitudes.find((solicitud) => !existingIds.has(solicitud.id))?.id ??
        refreshedSolicitudes[0]?.id

      if (!inferredSolicitudId) {
        throw new Error('Se creó la solicitud pero no fue posible determinar el trámite para cargar documentos.')
      }

      const documentosSeleccionados = payload.documentos.filter((documento) => documento.file)
      const failedUploads: string[] = []

      for (const documento of documentosSeleccionados) {
        const file = documento.file
        if (!file) {
          continue
        }

        try {
          const buffer = await file.arrayBuffer()
          const contenidoBase64 = await fileToBase64(file)
          const checksum = await sha256Hex(buffer)

          await uploadDocument({
            tipoDocumentoTramiteId: documento.id,
            nombreArchivo: file.name,
            tramiteId: inferredSolicitudId,
            usuarioCargaId: usuarioSappId,
            aspiranteCargaId: null,
            contenidoBase64,
            mimeType: file.type || 'application/octet-stream',
            tamanoBytes: file.size,
            checksum,
          })
        } catch (uploadError) {
          const message = uploadError instanceof Error ? uploadError.message : 'Error desconocido'
          failedUploads.push(`${documento.nombre}: ${message}`)
        }
      }

      if (failedUploads.length > 0) {
        const failedDetails = failedUploads.join(' | ')
        throw new Error(`La solicitud se creó, pero falló la carga de algunos documentos. ${failedDetails}`)
      }

      setFormSuccess('Solicitud y documentos registrados correctamente.')
      setViewMode('LIST')
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'No fue posible registrar la solicitud.')
    } finally {
      setSaving(false)
    }
  }


  const rowsDelTipoSeleccionado = useMemo(
    () => rows.filter((row) => (tipoSolicitudId === null ? true : row.tipoSolicitudId === tipoSolicitudId)),
    [rows, tipoSolicitudId],
  )
  const estadosDisponibles = useMemo(
    () => showAllEstadoOptions
      ? estadosCatalog
      : getEstadosPresentesEnSolicitudes(estadosCatalog, rowsDelTipoSeleccionado),
    [estadosCatalog, rowsDelTipoSeleccionado, showAllEstadoOptions],
  )
  const estadoIdActivo = estadosDisponibles.some((estado) => estado.id === estadoId) ? estadoId : null

  const filteredRows = rows
    .filter((row) => {
      if (estadoIdActivo === null) {
        return true
      }

      const normalized = normalizeEstadoSolicitud(row.estadoSigla || row.estado)
      if (normalized === 'UNKNOWN') {
        return false
      }

      return estadosCatalog.some((estado) => estado.id === estadoIdActivo && estado.sigla === normalized)
    })
    .filter((row) => (tipoSolicitudId === null ? true : row.tipoSolicitudId === tipoSolicitudId))
    .sort(compareSolicitudesDesc)

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <section className="solicitudes-estudiante-view">
      {viewMode === 'FORM' ? (
        <BackButton onClick={() => setViewMode('LIST')}>Volver al listado</BackButton>
      ) : null}
      <header className="solicitudes-estudiante-view__header">
        {/* <h3>{viewMode === 'LIST' ? 'Mis solicitudes' : 'Nueva solicitud'}</h3> */}
        {viewMode === 'LIST' ? (
          <button
            className="solicitudes-estudiante-view__primary"
            onClick={() => {
              setFormError(null)
              setFormSuccess(null)
              setViewMode('FORM')
            }}
            type="button"
          >
            Agregar solicitud
          </button>
        ) : null}
      </header>

      {loading ? (
        <p className="solicitudes-estudiante-view__status">Cargando información...</p>
      ) : error ? (
        <p className="solicitudes-estudiante-view__status solicitudes-estudiante-view__status--error">{error}</p>
      ) : viewMode === 'LIST' ? (
        <>
          <SolicitudesFiltersBar
            estadoId={estadoIdActivo}
            tipoSolicitudId={tipoSolicitudId}
            estadosCatalog={estadosDisponibles}
            tiposSolicitud={tiposSolicitud}
            disabled={loading}
            onChange={({ estadoId: nextEstadoId, tipoSolicitudId: nextTipoSolicitudId }) => {
              setEstadoId(nextEstadoId)
              setTipoSolicitudId(nextTipoSolicitudId)
              setCurrentPage(1)
            }}
          />
          {catalogError && <p className="solicitudes-estudiante-view__status">{catalogError}</p>}
          {filteredRows.length === 0 ? (
            <p className="solicitudes-estudiante-view__status">No hay resultados con los filtros seleccionados.</p>
          ) : (
            <>
              <SolicitudesTable mode="ESTUDIANTE" rows={paginatedRows} onRowClick={(solicitudId) => navigate(detailPath(solicitudId))} />
              <footer className="solicitudes-estudiante-view__pagination" aria-label="Paginación de solicitudes">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage <= 1}
                >
                  Anterior
                </button>
                <span>Página {safeCurrentPage} de {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage >= totalPages}
                >
                  Siguiente
                </button>
              </footer>
            </>
          )}
        </>
      ) : loadingTipos ? (
        <p className="solicitudes-estudiante-view__status">Cargando tipos de solicitud...</p>
      ) : (
        <>
          {formError && (
            <p className="solicitudes-estudiante-view__status solicitudes-estudiante-view__status--error">{formError}</p>
          )}
          {formSuccess && <p className="solicitudes-estudiante-view__status">{formSuccess}</p>}
          <SolicitudEstudianteForm
            tipos={tiposSolicitud}
            estudianteId={estudianteId as number}
            telefonoEstudiante={telefonoEstudiante}
            correoEstudiante={correoEstudiante}
            onPreviewCreditoCondonable={async (previewPayload) =>
              previsualizarSolicitudCredito({
                estudianteId: previewPayload.estudianteId,
                tipoSolicitudId: previewPayload.tipoSolicitudId,
                observaciones: previewPayload.observaciones,
                modalidadId: previewPayload.modalidadId,
                motivosCreditoCondonable: previewPayload.motivosCreditoCondonable,
                ciudadExpedicionDocumento: previewPayload.ciudadExpedicionDocumento,
                actividadesCreditoCondonable: previewPayload.actividadesCreditoCondonable,
                periodoAcademicoInicioCreditoCon: previewPayload.periodoAcademicoInicioCreditoCon,
                direccionEstudiante: previewPayload.direccionEstudiante,
                telefonoEstudiante: previewPayload.telefonoEstudiante,
                correoEstudiante: previewPayload.correoEstudiante,
                intensidadHorariaSemanal: previewPayload.intensidadHorariaSemanal,
                horasSemestre: previewPayload.horasSemestre,
                solicitudHomologacionesAsignaturas: [],
              })
            }
            onSubmit={handleRegisterSolicitud}
          />
          {saving && <p className="solicitudes-estudiante-view__status">Registrando solicitud...</p>}
        </>
      )}
    </section>
  )
}

export default SolicitudesEstudianteView
