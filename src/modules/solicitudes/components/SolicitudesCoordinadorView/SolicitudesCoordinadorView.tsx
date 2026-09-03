import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import type { SolicitudCoordinadorDto, TipoSolicitudDto } from '../../types'
import { getEstadosSolicitudCatalog } from '../../api/estadoSolicitudService'
import { DEFAULT_ESTADOS_SOLICITUD_CATALOG, type EstadoSolicitudCatalogItem } from '../../utils/estadoSolicitud'
import {
  getSolicitudesAcademicasAsignadas,
  getSolicitudesAcademicasFiltered,
} from '../../api/solicitudesAcademicasService'
import { getTiposSolicitud } from '../../api/tipoSolicitudService'
import SolicitudesFiltersBar from '../SolicitudesFiltersBar/SolicitudesFiltersBar'
import { sortSolicitudesDesc } from '../../utils/ordenSolicitudes'
import './SolicitudesCoordinadorView.css'

const PAGE_SIZE = 10

interface SolicitudesCoordinadorViewProps {
  usuarioSappId: number
  readOnly?: boolean
  assignedOnly?: boolean
}

const SolicitudesCoordinadorView = ({
  usuarioSappId,
  readOnly = false,
  assignedOnly = false,
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

        setTiposSolicitud(tipos)
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
  }, [])

  useEffect(() => {
    let mounted = true

    getSolicitudesAcademicasAsignadas(usuarioSappId)
      .then((solicitudes) => {
        if (mounted) {
          setAssignedError(null)
          setAssignedRows(sortSolicitudesDesc(solicitudes))
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
  }, [usuarioSappId, location.key, location.state])

  useEffect(() => {
    if (assignedOnly) {
      return
    }

    let mounted = true

    getSolicitudesAcademicasFiltered({
      estadoId: estadoId ?? undefined,
      tipoSolicitudId: tipoSolicitudId ?? undefined,
    })
      .then((solicitudes) => {
        if (!mounted) {
          return
        }
        setRows(sortSolicitudesDesc(solicitudes))
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
  }, [assignedOnly, estadoId, tipoSolicitudId, location.key, location.state])

  const assignedIds = new Set(assignedRows.map((solicitud) => solicitud.id))
  const availableRows = rows.filter((solicitud) => !assignedIds.has(solicitud.id))

  const totalPages = Math.max(1, Math.ceil(availableRows.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedRows = availableRows.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <section className="solicitudes-coordinador-view">
      {readOnly ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--warning">
          Vista de solo lectura.
        </p>
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
              navigate(`/solicitudes/${solicitudId}`, { state: { fromAssigned: true } })
            }
          />
        )}
      </section>
      {!assignedOnly ? (
      <section className="solicitudes-coordinador-view__list" aria-labelledby="solicitudes-title">
      <h3 id="solicitudes-title">Solicitudes</h3>
      <SolicitudesFiltersBar
        estadoId={estadoId}
        tipoSolicitudId={tipoSolicitudId}
        estadosCatalog={estadosCatalog}
        tiposSolicitud={tiposSolicitud}
        disabled={loading || assignedLoading}
        onChange={({ estadoId: nextEstadoId, tipoSolicitudId: nextTipoSolicitudId }) => {
          setLoading(true)
          setError(null)
          setEstadoId(nextEstadoId)
          setTipoSolicitudId(nextTipoSolicitudId)
        }}
      />
      {tiposError ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--warning">{tiposError}</p>
      ) : null}
      {loading || assignedLoading ? (
        <p className="solicitudes-coordinador-view__status">Cargando solicitudes...</p>
      ) : error ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--error">{error}</p>
      ) : availableRows.length === 0 ? (
        <p className="solicitudes-coordinador-view__status">No hay resultados con los filtros seleccionados.</p>
      ) : (
        <>
          <SolicitudesTable
            mode="COORDINADOR"
            rows={paginatedRows}
            onRowClick={(solicitudId) => navigate(`/solicitudes/${solicitudId}`)}
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
