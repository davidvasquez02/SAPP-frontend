import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import type { SolicitudCoordinadorDto, TipoSolicitudDto } from '../../types'
import { getEstadosSolicitudCatalog } from '../../api/estadoSolicitudService'
import {
  DEFAULT_ESTADOS_SOLICITUD_CATALOG,
  getEstadosPresentesEnSolicitudes,
  normalizeEstadoSolicitud,
  type EstadoSolicitudCatalogItem,
} from '../../utils/estadoSolicitud'
import {
  getSolicitudesAcademicasAsignadas,
  getSolicitudesAcademicasFiltered,
} from '../../api/solicitudesAcademicasService'
import { getTiposSolicitud } from '../../api/tipoSolicitudService'
import SolicitudesFiltersBar from '../SolicitudesFiltersBar/SolicitudesFiltersBar'
import { sortSolicitudesDesc } from '../../utils/ordenSolicitudes'
import {
  isSolicitudCreditoCondonable,
  isTipoSolicitudCreditoCondonable,
} from '../../utils/creditoCondonable'
import './SolicitudesCoordinadorView.css'

const PAGE_SIZE = 10
const identityTipoSolicitud = (tipo: TipoSolicitudDto) => tipo

interface SolicitudesCoordinadorViewProps {
  usuarioSappId: number
  readOnly?: boolean
  assignedOnly?: boolean
  excludeCreditosCondonables?: boolean
  includeTipoSolicitudIds?: readonly number[]
  excludeTipoSolicitudIds?: ReadonlySet<number>
  detailPath?: (solicitudId: number) => string
  transformTipoSolicitud?: (tipo: TipoSolicitudDto) => TipoSolicitudDto
}

const SolicitudesCoordinadorView = ({
  usuarioSappId,
  readOnly = false,
  assignedOnly = false,
  excludeCreditosCondonables = false,
  includeTipoSolicitudIds,
  excludeTipoSolicitudIds,
  detailPath = (solicitudId) => `/solicitudes/${solicitudId}`,
  transformTipoSolicitud = identityTipoSolicitud,
}: SolicitudesCoordinadorViewProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null)
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [estadosCatalog, setEstadosCatalog] = useState<EstadoSolicitudCatalogItem[]>(DEFAULT_ESTADOS_SOLICITUD_CATALOG)
  const [rows, setRows] = useState<SolicitudCoordinadorDto[]>([])
  const [assignedRows, setAssignedRows] = useState<SolicitudCoordinadorDto[]>([])
  const [assignedLoading, setAssignedLoading] = useState(true)
  const [assignedError, setAssignedError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tiposError, setTiposError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let mounted = true

    Promise.all([getTiposSolicitud(), getEstadosSolicitudCatalog()])
      .then(([tipos, estados]) => {
        if (!mounted) {
          return
        }

        setTiposSolicitud(tipos.filter((tipo) => {
          if (excludeCreditosCondonables && isTipoSolicitudCreditoCondonable(tipo)) return false
          if (includeTipoSolicitudIds && !includeTipoSolicitudIds.includes(tipo.id)) return false
          return !excludeTipoSolicitudIds?.has(tipo.id)
        }).map(transformTipoSolicitud))
        if (estados.length > 0) {
          setEstadosCatalog(estados)
        }
      })
      .catch((fetchError) => {
        if (!mounted) {
          return
        }

        setTiposError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar catálogos de solicitudes.')
      })

    return () => {
      mounted = false
    }
  }, [excludeCreditosCondonables, excludeTipoSolicitudIds, includeTipoSolicitudIds, transformTipoSolicitud])

  useEffect(() => {
    let mounted = true

    getSolicitudesAcademicasAsignadas(usuarioSappId)
      .then((solicitudes) => {
        if (mounted) {
          setAssignedError(null)
          let visibleSolicitudes = excludeCreditosCondonables
            ? solicitudes.filter((solicitud) => !isSolicitudCreditoCondonable(solicitud))
            : solicitudes
          if (includeTipoSolicitudIds) visibleSolicitudes = visibleSolicitudes.filter((item) => includeTipoSolicitudIds.includes(item.tipoSolicitudId))
          if (excludeTipoSolicitudIds) visibleSolicitudes = visibleSolicitudes.filter((item) => !excludeTipoSolicitudIds.has(item.tipoSolicitudId))
          setAssignedRows(sortSolicitudesDesc(visibleSolicitudes))
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setAssignedError(
            fetchError instanceof Error ? fetchError.message : 'No fue posible cargar las solicitudes asignadas.',
          )
        }
      })
      .finally(() => {
        if (mounted) {
          setAssignedLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [excludeCreditosCondonables, excludeTipoSolicitudIds, includeTipoSolicitudIds, usuarioSappId, location.key, location.state])

  useEffect(() => {
    if (assignedOnly) {
      return
    }

    let mounted = true

    getSolicitudesAcademicasFiltered({
      tipoSolicitudId: tipoSolicitudId ?? undefined,
    })
      .then((solicitudes) => {
        if (!mounted) {
          return
        }
        let visibleSolicitudes = excludeCreditosCondonables
          ? solicitudes.filter((solicitud) => !isSolicitudCreditoCondonable(solicitud))
          : solicitudes
        if (includeTipoSolicitudIds) visibleSolicitudes = visibleSolicitudes.filter((item) => includeTipoSolicitudIds.includes(item.tipoSolicitudId))
        if (excludeTipoSolicitudIds) visibleSolicitudes = visibleSolicitudes.filter((item) => !excludeTipoSolicitudIds.has(item.tipoSolicitudId))
        setRows(sortSolicitudesDesc(visibleSolicitudes))
        setCurrentPage(1)
      })
      .catch((fetchError) => {
        if (!mounted) {
          return
        }
        setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar el listado de solicitudes.')
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [assignedOnly, excludeCreditosCondonables, excludeTipoSolicitudIds, includeTipoSolicitudIds, tipoSolicitudId, location.key, location.state])

  const availableRows = useMemo(() => {
    const assignedIds = new Set(assignedRows.map((solicitud) => solicitud.id))
    return rows.filter((solicitud) => !assignedIds.has(solicitud.id))
  }, [assignedRows, rows])
  const estadosPresentes = useMemo(
    () => getEstadosPresentesEnSolicitudes(estadosCatalog, availableRows),
    [availableRows, estadosCatalog],
  )
  const estadoIdActivo = estadosPresentes.some((estado) => estado.id === estadoId) ? estadoId : null
  const estadoSiglaActiva = estadosPresentes.find((estado) => estado.id === estadoIdActivo)?.sigla
  const filteredRows = availableRows.filter((solicitud) => {
    if (!estadoSiglaActiva) {
      return true
    }

    return normalizeEstadoSolicitud(solicitud.estadoSigla || solicitud.estado) === estadoSiglaActiva
  })

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <section className="solicitudes-coordinador-view">
      {readOnly ? (
        <p />
      ) : null}
      <section className="solicitudes-coordinador-view__list" aria-labelledby="solicitudes-asignadas-title">
        <h3 id="solicitudes-asignadas-title">Solicitudes asignadas</h3>
        {assignedLoading ? (
          <p className="solicitudes-coordinador-view__status">Cargando solicitudes asignadas...</p>
        ) : assignedError ? (
          <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--error">
            {assignedError}
          </p>
        ) : assignedRows.length === 0 ? (
          <p className="solicitudes-coordinador-view__status">No tienes solicitudes asignadas.</p>
        ) : (
          <SolicitudesTable
            mode="COORDINADOR"
            rows={assignedRows}
            onRowClick={(solicitudId) =>
              navigate(detailPath(solicitudId), { state: { fromAssigned: true } })
            }
          />
        )}
      </section>
      {!assignedOnly ? (
        <section className="solicitudes-coordinador-view__list" aria-labelledby="solicitudes-title">
          <h3 id="solicitudes-title">Solicitudes</h3>
          <SolicitudesFiltersBar
            estadoId={estadoIdActivo}
            tipoSolicitudId={tipoSolicitudId}
            estadosCatalog={estadosPresentes}
            tiposSolicitud={tiposSolicitud}
            disabled={loading || assignedLoading}
            onChange={({ estadoId: nextEstadoId, tipoSolicitudId: nextTipoSolicitudId }) => {
              if (nextTipoSolicitudId !== tipoSolicitudId) {
                setLoading(true)
              }
              setError(null)
              setEstadoId(nextEstadoId)
              setTipoSolicitudId(nextTipoSolicitudId)
              setCurrentPage(1)
            }}
          />
          {tiposError ? (
            <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--warning">{tiposError}</p>
          ) : null}
          {loading || assignedLoading ? (
            <p className="solicitudes-coordinador-view__status">Cargando solicitudes...</p>
          ) : error ? (
            <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--error">{error}</p>
          ) : filteredRows.length === 0 ? (
            <p className="solicitudes-coordinador-view__status">No hay resultados con los filtros seleccionados.</p>
          ) : (
            <>
              <SolicitudesTable
                mode="COORDINADOR"
                rows={paginatedRows}
                onRowClick={(solicitudId) => navigate(detailPath(solicitudId))}
              />
              <footer className="solicitudes-coordinador-view__pagination" aria-label="Paginación de solicitudes">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage <= 1}
                >
                  Anterior
                </button>
                <span>
                  Página {safeCurrentPage} de {totalPages}
                </span>
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
        </section>
      ) : null}
    </section>
  )
}

export default SolicitudesCoordinadorView
