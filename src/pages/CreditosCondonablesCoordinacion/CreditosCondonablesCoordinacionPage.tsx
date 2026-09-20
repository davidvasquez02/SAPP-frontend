import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getSolicitudesAcademicas } from '../../modules/solicitudes/api/solicitudesAcademicasService'
import type { SolicitudAcademicaDto } from '../../modules/solicitudes/api/types'
import SolicitudesTable from '../../modules/solicitudes/components/SolicitudesTable/SolicitudesTable'
import StatusBadge from '../../modules/solicitudes/components/StatusBadge/StatusBadge'
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
const MOBILE_QUERY = '(max-width: 768px)'
const ESTADOS_HISTORICOS = new Set(['APROBADA', 'RECHAZADA'])
type Listing = 'pendientes' | 'historico'

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
    <select id={id} value={value ?? ''} disabled={disabled} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}>
      <option value="">Todos</option>
      {estados.map((estado) => <option key={estado.id} value={estado.id}>{estado.label}</option>)}
    </select>
  </label>
)

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const displayText = (value: string | null | undefined, fallback: string) => value?.trim() || fallback

const SolicitudMobileCard = ({ solicitud }: { solicitud: SolicitudAcademicaDto }) => {
  const [expanded, setExpanded] = useState(false)
  const observationId = `credito-observacion-${solicitud.id}`
  const observaciones = displayText(solicitud.observaciones, 'Sin observaciones.')
  const canCollapse = observaciones.length > 140

  return (
    <article className="creditos-condonables__card">
      <header className="creditos-condonables__card-header">
        <div>
          <h3>{displayText(solicitud.estudiante, 'Estudiante sin nombre')}</h3>
          <p className="creditos-condonables__student-code">Código UIS: {displayText(solicitud.codigoEstudianteUis, '—')}</p>
          <p className="creditos-condonables__request-type">{displayText(solicitud.tipoSolicitud, 'Sin descripción.')}</p>
        </div>
        <StatusBadge estado={solicitud.estadoSigla || solicitud.estado} programaAcademico={solicitud.programaAcademico} size="md" />
      </header>
      <dl className="creditos-condonables__card-data">
        <div className="creditos-condonables__card-program"><dt>Programa</dt><dd>{displayText(solicitud.programaAcademico, '—')}</dd></div>
        <div><dt>Fecha de registro</dt><dd>{formatDate(solicitud.fechaRegistro)}</dd></div>
        <div><dt>Fecha de resolución</dt><dd>{formatDate(solicitud.fechaResolucion)}</dd></div>
      </dl>
      <div className="creditos-condonables__observations">
        <h4>Observaciones</h4>
        <p id={observationId} className={!expanded && canCollapse ? 'creditos-condonables__observations-text--collapsed' : undefined}>{observaciones}</p>
        {canCollapse && <button type="button" aria-expanded={expanded} aria-controls={observationId} onClick={() => setExpanded((value) => !value)}>{expanded ? 'Ver menos' : 'Ver más'}</button>}
      </div>
      <Link className="creditos-condonables__detail-link" to={`/creditos-condonables/${solicitud.id}`}>Ver solicitud</Link>
    </article>
  )
}

const paginate = (rows: SolicitudAcademicaDto[], page: number) => {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  return { page: safePage, totalPages, rows: rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) }
}

const useMobileViewport = () => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY)
    const update = () => setIsMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return isMobile
}

const CreditosCondonablesCoordinacionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMobileViewport()
  const [activeListing, setActiveListing] = useState<Listing>('pendientes')
  const [solicitudes, setSolicitudes] = useState<SolicitudAcademicaDto[]>([])
  const [estados, setEstados] = useState<EstadoSolicitudCatalogItem[]>(DEFAULT_ESTADOS_SOLICITUD_CATALOG)
  const [estadoPendienteId, setEstadoPendienteId] = useState<number | null>(null)
  const [estadoHistoricoId, setEstadoHistoricoId] = useState<number | null>(null)
  const [estudianteId, setEstudianteId] = useState('')
  const [pendingPage, setPendingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const pendingTabRef = useRef<HTMLButtonElement>(null)
  const historyTabRef = useRef<HTMLButtonElement>(null)

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
        if (mounted) setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar los créditos condonables.')
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [location.key, location.state, reloadKey])

  const pendientes = useMemo(() => solicitudes.filter((item) => !ESTADOS_HISTORICOS.has(normalizeEstadoSolicitud(item.estadoSigla || item.estado))), [solicitudes])
  const historico = useMemo(() => solicitudes.filter((item) => ESTADOS_HISTORICOS.has(normalizeEstadoSolicitud(item.estadoSigla || item.estado))), [solicitudes])
  const estadosPendientes = useMemo(() => getEstadosPresentesEnSolicitudes(estados, pendientes), [estados, pendientes])
  const estadosHistoricos = useMemo(() => getEstadosPresentesEnSolicitudes(estados, historico), [estados, historico])
  const estudiantesHistoricos = useMemo(() => {
    const unique = new Map<number, { id: number; nombre: string; codigo: string }>()
    historico.forEach((item) => { if (!unique.has(item.estudianteId)) unique.set(item.estudianteId, { id: item.estudianteId, nombre: item.estudiante, codigo: item.codigoEstudianteUis }) })
    return [...unique.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  }, [historico])

  const filterByEstado = useCallback((rows: SolicitudAcademicaDto[], estadoId: number | null) => {
    if (estadoId === null) return rows
    const estado = estados.find((item) => item.id === estadoId)
    return estado ? rows.filter((row) => normalizeEstadoSolicitud(row.estadoSigla || row.estado) === estado.sigla) : rows
  }, [estados])
  const pendientesFiltradas = filterByEstado(pendientes, estadoPendienteId)
  const historicoFiltrado = filterByEstado(historico, estadoHistoricoId).filter((item) => !estudianteId || String(item.estudianteId) === estudianteId)
  const pendingPagination = paginate(pendientesFiltradas, pendingPage)
  const historyPagination = paginate(historicoFiltrado, historyPage)

  const selectTab = (listing: Listing, focus = false) => {
    setActiveListing(listing)
    if (focus) requestAnimationFrame(() => (listing === 'pendientes' ? pendingTabRef : historyTabRef).current?.focus())
  }
  const handleTabKeyDown = (event: React.KeyboardEvent, listing: Listing) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); selectTab(listing === 'pendientes' ? 'historico' : 'pendientes', true) }
    if (event.key === 'Home') { event.preventDefault(); selectTab('pendientes', true) }
    if (event.key === 'End') { event.preventDefault(); selectTab('historico', true) }
  }
  const renderPagination = (page: number, totalPages: number, onChange: (page: number) => void, label: string) => (
    <footer className="creditos-condonables__pagination" aria-label={`Paginación de ${label}`}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      <span aria-live="polite">Página {page} de {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</button>
    </footer>
  )
  const renderResults = (rows: SolicitudAcademicaDto[], emptyMessage: string) => {
    if (loading) return <p className="creditos-condonables__status" role="status">Cargando solicitudes...</p>
    if (error) return <div className="creditos-condonables__status creditos-condonables__status--error" role="alert"><p>{error}</p><button type="button" onClick={() => { setLoading(true); setReloadKey((key) => key + 1) }}>Reintentar</button></div>
    if (rows.length === 0) return <p className="creditos-condonables__status">{emptyMessage}</p>
    return <><div className="creditos-condonables__desktop-table"><SolicitudesTable mode="COORDINADOR" rows={rows} onRowClick={(id) => navigate(`/creditos-condonables/${id}`)} /></div><div className="creditos-condonables__mobile-cards">{rows.map((row) => <SolicitudMobileCard key={row.id} solicitud={row} />)}</div></>
  }

  return (
    <ModuleLayout title="Créditos condonables" compactOnMobile>
      <div className="creditos-condonables">
        {isMobile && <div className="creditos-condonables__tabs" role="tablist" aria-label="Listados de créditos condonables">
          <button ref={pendingTabRef} id="creditos-tab-pendientes" role="tab" aria-selected={activeListing === 'pendientes'} aria-controls="creditos-panel-pendientes" tabIndex={activeListing === 'pendientes' ? 0 : -1} onClick={() => selectTab('pendientes')} onKeyDown={(event) => handleTabKeyDown(event, 'pendientes')}>Pendientes <span aria-label={`${pendientes.length} solicitudes`}>{pendientes.length}</span></button>
          <button ref={historyTabRef} id="creditos-tab-historico" role="tab" aria-selected={activeListing === 'historico'} aria-controls="creditos-panel-historico" tabIndex={activeListing === 'historico' ? 0 : -1} onClick={() => selectTab('historico')} onKeyDown={(event) => handleTabKeyDown(event, 'historico')}>Histórico <span aria-label={`${historico.length} solicitudes`}>{historico.length}</span></button>
        </div>}
        <section id="creditos-panel-pendientes" className="creditos-condonables__section" aria-labelledby={isMobile ? 'creditos-tab-pendientes' : 'creditos-pendientes-title'} role={isMobile ? 'tabpanel' : undefined} hidden={isMobile && activeListing !== 'pendientes'}>
          <header><h2 id="creditos-pendientes-title">Solicitudes pendientes</h2><p>Solicitudes y renovaciones que requieren seguimiento.</p></header>
          <div className="creditos-condonables__filters"><EstadoFilter id="estado-credito-pendiente" value={estadoPendienteId} estados={estadosPendientes} disabled={loading} onChange={(value) => { setEstadoPendienteId(value); setPendingPage(1) }} /></div>
          {renderResults(pendingPagination.rows, pendientes.length === 0 ? 'No hay solicitudes pendientes.' : 'No hay solicitudes pendientes con el filtro seleccionado.')}
          {!loading && !error && pendientesFiltradas.length > 0 && renderPagination(pendingPagination.page, pendingPagination.totalPages, setPendingPage, 'solicitudes pendientes')}
        </section>
        <section id="creditos-panel-historico" className="creditos-condonables__section" aria-labelledby={isMobile ? 'creditos-tab-historico' : 'creditos-historico-title'} role={isMobile ? 'tabpanel' : undefined} hidden={isMobile && activeListing !== 'historico'}>
          <header><h2 id="creditos-historico-title">Histórico de solicitudes</h2><p>Solicitudes aprobadas y rechazadas.</p></header>
          <div className="creditos-condonables__filters">
            <EstadoFilter id="estado-credito-historico" value={estadoHistoricoId} estados={estadosHistoricos} disabled={loading} onChange={(value) => { setEstadoHistoricoId(value); setHistoryPage(1) }} />
            <label className="creditos-condonables__field sapp-filter-field" htmlFor="estudiante-credito-historico"><span>Estudiante</span><select id="estudiante-credito-historico" value={estudianteId} disabled={loading || estudiantesHistoricos.length === 0} onChange={(event) => { setEstudianteId(event.target.value); setHistoryPage(1) }}><option value="">Todos</option>{estudiantesHistoricos.map((student) => <option key={student.id} value={student.id}>{student.nombre}{student.codigo ? ` — ${student.codigo}` : ''}</option>)}</select></label>
            <button className="sapp-filters-clear-button" type="button" disabled={loading || (estadoHistoricoId === null && !estudianteId)} onClick={() => { setEstadoHistoricoId(null); setEstudianteId(''); setHistoryPage(1) }}>Limpiar filtros</button>
          </div>
          {renderResults(historyPagination.rows, historico.length === 0 ? 'No hay solicitudes en el histórico.' : 'No hay solicitudes históricas con los filtros seleccionados.')}
          {!loading && !error && historicoFiltrado.length > 0 && renderPagination(historyPagination.page, historyPagination.totalPages, setHistoryPage, 'histórico de solicitudes')}
        </section>
      </div>
    </ModuleLayout>
  )
}

export default CreditosCondonablesCoordinacionPage
