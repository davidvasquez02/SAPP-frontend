import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getSolicitudesAcademicas } from '../../modules/solicitudes/api/solicitudesAcademicasService'
import type { SolicitudAcademicaDto } from '../../modules/solicitudes/api/types'
import SolicitudesTable from '../../modules/solicitudes/components/SolicitudesTable/SolicitudesTable'
import { getEstadosSolicitudCatalog } from '../../modules/solicitudes/api/estadoSolicitudService'
import {
  DEFAULT_ESTADOS_SOLICITUD_CATALOG,
  getEstadosPresentesEnSolicitudes,
  normalizeEstadoSolicitud,
  type EstadoSolicitudCatalogItem,
} from '../../modules/solicitudes/utils/estadoSolicitud'
import { isSolicitudCreditoCondonable } from '../../modules/solicitudes/utils/creditoCondonable'
import { sortSolicitudesDesc } from '../../modules/solicitudes/utils/ordenSolicitudes'
import './CreditosCondonablesCoordinacionPage.css'

const PAGE_SIZE = 10
const ESTADOS_HISTORICOS = new Set(['APROBADA', 'RECHAZADA'])

interface EstadoFilterProps {
  id: string
  value: number | null
  estados: EstadoSolicitudCatalogItem[]
  disabled: boolean
  onChange: (value: number | null) => void
}

const EstadoFilter = ({ id, value, estados, disabled, onChange }: EstadoFilterProps) => (
  <label className="creditos-condonables__field sapp-filter-field" htmlFor={id}>
    <span>Estado</span>
    <select
      id={id}
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
    >
      <option value="">Todos</option>
      {estados.map((estado) => (
        <option key={estado.id} value={estado.id}>{estado.label}</option>
      ))}
    </select>
  </label>
)

const paginate = (rows: SolicitudAcademicaDto[], page: number) => {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  return {
    page: safePage,
    totalPages,
    rows: rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
  }
}

const CreditosCondonablesCoordinacionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [solicitudes, setSolicitudes] = useState<SolicitudAcademicaDto[]>([])
  const [estados, setEstados] = useState<EstadoSolicitudCatalogItem[]>(DEFAULT_ESTADOS_SOLICITUD_CATALOG)
  const [estadoPendienteId, setEstadoPendienteId] = useState<number | null>(null)
  const [estadoHistoricoId, setEstadoHistoricoId] = useState<number | null>(null)
  const [estudianteId, setEstudianteId] = useState('')
  const [pendingPage, setPendingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    Promise.all([getSolicitudesAcademicas(), getEstadosSolicitudCatalog()])
      .then(([response, estadosResponse]) => {
        if (!mounted) return
        setError(null)
        setSolicitudes(sortSolicitudesDesc(response.filter(isSolicitudCreditoCondonable)))
        if (estadosResponse.length > 0) setEstados(estadosResponse)
      })
      .catch((fetchError) => {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar los créditos condonables.')
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [location.key, location.state])

  const pendientes = useMemo(
    () => solicitudes.filter((solicitud) => !ESTADOS_HISTORICOS.has(normalizeEstadoSolicitud(solicitud.estadoSigla || solicitud.estado))),
    [solicitudes],
  )
  const historico = useMemo(
    () => solicitudes.filter((solicitud) => ESTADOS_HISTORICOS.has(normalizeEstadoSolicitud(solicitud.estadoSigla || solicitud.estado))),
    [solicitudes],
  )
  const estadosPendientes = useMemo(() => getEstadosPresentesEnSolicitudes(estados, pendientes), [estados, pendientes])
  const estadosHistoricos = useMemo(() => getEstadosPresentesEnSolicitudes(estados, historico), [estados, historico])
  const estudiantesHistoricos = useMemo(() => {
    const estudiantesUnicos = new Map<number, { id: number; nombre: string; codigo: string }>()

    historico.forEach((solicitud) => {
      if (!estudiantesUnicos.has(solicitud.estudianteId)) {
        estudiantesUnicos.set(solicitud.estudianteId, {
          id: solicitud.estudianteId,
          nombre: solicitud.estudiante,
          codigo: solicitud.codigoEstudianteUis,
        })
      }
    })

    return [...estudiantesUnicos.values()].sort((left, right) =>
      left.nombre.localeCompare(right.nombre, 'es', { sensitivity: 'base' }),
    )
  }, [historico])

  const filterByEstado = (rows: SolicitudAcademicaDto[], estadoId: number | null) => {
    if (estadoId === null) return rows
    const estado = estados.find((item) => item.id === estadoId)
    return estado
      ? rows.filter((row) => normalizeEstadoSolicitud(row.estadoSigla || row.estado) === estado.sigla)
      : rows
  }

  const pendientesFiltradas = filterByEstado(pendientes, estadoPendienteId)
  const historicoFiltrado = filterByEstado(historico, estadoHistoricoId).filter((solicitud) =>
    !estudianteId || String(solicitud.estudianteId) === estudianteId,
  )
  const pendingPagination = paginate(pendientesFiltradas, pendingPage)
  const historyPagination = paginate(historicoFiltrado, historyPage)

  const renderPagination = (page: number, totalPages: number, onChange: (page: number) => void, label: string) => (
    <footer className="creditos-condonables__pagination" aria-label={`Paginación de ${label}`}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      <span>Página {page} de {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</button>
    </footer>
  )

  const renderTable = (rows: SolicitudAcademicaDto[], emptyMessage: string) => {
    if (loading) return <p className="creditos-condonables__status">Cargando solicitudes...</p>
    if (error) return <p className="creditos-condonables__status creditos-condonables__status--error">{error}</p>
    if (rows.length === 0) return <p className="creditos-condonables__status">{emptyMessage}</p>
    return <SolicitudesTable mode="COORDINADOR" rows={rows} onRowClick={(id) => navigate(`/creditos-condonables/${id}`)} />
  }

  return (
    <ModuleLayout title="Créditos condonables">
      <div className="creditos-condonables">
        <section className="creditos-condonables__section" aria-labelledby="creditos-pendientes-title">
          <header><h2 id="creditos-pendientes-title">Solicitudes pendientes</h2><p>Solicitudes y renovaciones que requieren seguimiento.</p></header>
          <div className="creditos-condonables__filters">
            <EstadoFilter id="estado-credito-pendiente" value={estadoPendienteId} estados={estadosPendientes} disabled={loading} onChange={(value) => { setEstadoPendienteId(value); setPendingPage(1) }} />
          </div>
          {renderTable(pendingPagination.rows, 'No hay solicitudes pendientes con el filtro seleccionado.')}
          {!loading && !error && pendientesFiltradas.length > 0 && renderPagination(pendingPagination.page, pendingPagination.totalPages, setPendingPage, 'solicitudes pendientes')}
        </section>

        <section className="creditos-condonables__section" aria-labelledby="creditos-historico-title">
          <header><h2 id="creditos-historico-title">Histórico de solicitudes</h2><p>Solicitudes aprobadas y rechazadas.</p></header>
          <div className="creditos-condonables__filters">
            <EstadoFilter id="estado-credito-historico" value={estadoHistoricoId} estados={estadosHistoricos} disabled={loading} onChange={(value) => { setEstadoHistoricoId(value); setHistoryPage(1) }} />
            <label className="creditos-condonables__field sapp-filter-field" htmlFor="estudiante-credito-historico">
              <span>Estudiante</span>
              <select
                id="estudiante-credito-historico"
                value={estudianteId}
                disabled={loading || estudiantesHistoricos.length === 0}
                onChange={(event) => { setEstudianteId(event.target.value); setHistoryPage(1) }}
              >
                <option value="">Todos</option>
                {estudiantesHistoricos.map((estudiante) => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.nombre}{estudiante.codigo ? ` — ${estudiante.codigo}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <button className="sapp-filters-clear-button" type="button" disabled={loading || (estadoHistoricoId === null && !estudianteId)} onClick={() => { setEstadoHistoricoId(null); setEstudianteId(''); setHistoryPage(1) }}>Limpiar filtros</button>
          </div>
          {renderTable(historyPagination.rows, 'No hay solicitudes históricas con los filtros seleccionados.')}
          {!loading && !error && historicoFiltrado.length > 0 && renderPagination(historyPagination.page, historyPagination.totalPages, setHistoryPage, 'histórico de solicitudes')}
        </section>
      </div>
    </ModuleLayout>
  )
}

export default CreditosCondonablesCoordinacionPage
