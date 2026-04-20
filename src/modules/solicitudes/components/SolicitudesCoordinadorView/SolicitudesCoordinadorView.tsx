import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SolicitudesTable from '../SolicitudesTable/SolicitudesTable'
import type { SolicitudCoordinadorDto, TipoSolicitudDto } from '../../types'
import { getEstadosSolicitudCatalog } from '../../api/estadoSolicitudService'
import { DEFAULT_ESTADOS_SOLICITUD_CATALOG, type EstadoSolicitudCatalogItem } from '../../utils/estadoSolicitud'
import { getSolicitudesAcademicasFiltered } from '../../api/solicitudesAcademicasService'
import { getTiposSolicitud } from '../../api/tipoSolicitudService'
import SolicitudesFiltersBar from '../SolicitudesFiltersBar/SolicitudesFiltersBar'
import './SolicitudesCoordinadorView.css'

const PAGE_SIZE = 10

interface SolicitudesCoordinadorViewProps {
  readOnly?: boolean
}

const parseDateToEpoch = (value: string | null) => {
  if (!value) {
    return 0
  }

  const epoch = Date.parse(value)
  return Number.isNaN(epoch) ? 0 : epoch
}

const SolicitudesCoordinadorView = ({ readOnly = false }: SolicitudesCoordinadorViewProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null)
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitudDto[]>([])
  const [estadosCatalog, setEstadosCatalog] = useState<EstadoSolicitudCatalogItem[]>(DEFAULT_ESTADOS_SOLICITUD_CATALOG)
  const [rows, setRows] = useState<SolicitudCoordinadorDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tiposError, setTiposError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let mounted = true

    setTiposError(null)

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

    setLoading(true)
    setError(null)

    getSolicitudesAcademicasFiltered({
      estadoId: estadoId ?? undefined,
      tipoSolicitudId: tipoSolicitudId ?? undefined,
    })
      .then((solicitudes) => {
        if (!mounted) {
          return
        }
        const sortedRows = [...solicitudes].sort(
          (left, right) => parseDateToEpoch(right.fechaRegistro) - parseDateToEpoch(left.fechaRegistro),
        )
        setRows(sortedRows)
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
  }, [estadoId, tipoSolicitudId, location.key, location.state])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedRows = rows.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <section className="solicitudes-coordinador-view">
      <h3>Solicitudes</h3>
      {readOnly ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--warning">
          Vista de solo lectura.
        </p>
      ) : null}
      <SolicitudesFiltersBar
        estadoId={estadoId}
        tipoSolicitudId={tipoSolicitudId}
        estadosCatalog={estadosCatalog}
        tiposSolicitud={tiposSolicitud}
        disabled={loading}
        onChange={({ estadoId: nextEstadoId, tipoSolicitudId: nextTipoSolicitudId }) => {
          setEstadoId(nextEstadoId)
          setTipoSolicitudId(nextTipoSolicitudId)
        }}
      />
      {tiposError ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--warning">{tiposError}</p>
      ) : null}
      {loading ? (
        <p className="solicitudes-coordinador-view__status">Cargando solicitudes...</p>
      ) : error ? (
        <p className="solicitudes-coordinador-view__status solicitudes-coordinador-view__status--error">{error}</p>
      ) : rows.length === 0 ? (
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
  )
}

export default SolicitudesCoordinadorView
