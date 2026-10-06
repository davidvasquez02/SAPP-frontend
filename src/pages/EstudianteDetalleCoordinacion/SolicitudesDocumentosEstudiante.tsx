import { useEffect, useMemo, useRef, useState } from 'react'
import { getSolicitudesAcademicasByEstudiante } from '../../modules/solicitudes/api/solicitudesAcademicasService'
import { getSolicitudDocumentosAdjuntos } from '../../modules/solicitudes/api/solicitudDocumentosService'
import type { SolicitudAcademicaDto } from '../../modules/solicitudes/api/types'
import type { SolicitudDocumentoAdjuntoDto } from '../../modules/solicitudes/types/documentosAdjuntos'
import DocumentosAdjuntos from '../../modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos'
import { formatFechaSolicitudDocumental, seleccionarSolicitudesDocumentales } from './solicitudesDocumentales'

const PAGE_SIZE = 5

interface SolicitudDocumentosCardProps {
  solicitud: SolicitudAcademicaDto
  active: boolean
}

const SolicitudDocumentosCard = ({ solicitud, active }: SolicitudDocumentosCardProps) => {
  const [documentos, setDocumentos] = useState<SolicitudDocumentoAdjuntoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const loadedRef = useRef(false)
  const codigoTipoTramite = solicitud.tipoTramiteCodigo?.trim() ?? ''

  useEffect(() => {
    if (!active || loadedRef.current || !codigoTipoTramite) return
    let ignore = false
    getSolicitudDocumentosAdjuntos({ tramiteId: solicitud.id, codigoTipoTramite })
      .then((data) => {
        if (ignore) return
        setDocumentos(data)
        loadedRef.current = true
      })
      .catch((err: unknown) => {
        if (ignore) return
        loadedRef.current = true
        setError(err instanceof Error ? err.message : 'No fue posible cargar los documentos de esta solicitud.')
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })
    return () => { ignore = true }
  }, [active, codigoTipoTramite, solicitud.id, retry])

  return (
    <article className="estudiante-detalle__tab-card">
      <header className="estudiante-detalle__tab-card-header">
        <h3>{solicitud.tipoSolicitud || 'Solicitud académica'} · #{solicitud.id}</h3>
        <span className="estudiante-detalle__badge estudiante-detalle__badge--neutral">{solicitud.estado}</span>
      </header>
      <div className="estudiante-detalle__tab-card-meta">
        <p>Fecha de registro: {formatFechaSolicitudDocumental(solicitud.fechaRegistro)}</p>
      </div>
      {codigoTipoTramite ? (
        <DocumentosAdjuntos
          documentos={documentos}
          isLoading={isLoading}
          error={error}
          onRetry={() => {
            loadedRef.current = false
            setIsLoading(true)
            setError(null)
            setRetry((value) => value + 1)
          }}
        />
      ) : (
        <p className="estudiante-detalle__mini-status">Esta solicitud no tiene un tipo de trámite asociado para consultar sus documentos.</p>
      )}
    </article>
  )
}

interface SolicitudesDocumentosEstudianteProps {
  estudianteId: number
  active: boolean
}

const SolicitudesDocumentosEstudiante = ({ estudianteId, active }: SolicitudesDocumentosEstudianteProps) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudAcademicaDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!active || loadedRef.current) return
    let ignore = false
    getSolicitudesAcademicasByEstudiante(estudianteId)
      .then((data) => {
        if (ignore) return
        setSolicitudes(data.filter((solicitud) => solicitud.estudianteId === estudianteId))
        loadedRef.current = true
      })
      .catch((err: unknown) => {
        if (ignore) return
        loadedRef.current = true
        setError(err instanceof Error ? err.message : 'No fue posible cargar las solicitudes del estudiante.')
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })
    return () => { ignore = true }
  }, [active, estudianteId, retry])

  const resultado = useMemo(() => seleccionarSolicitudesDocumentales(solicitudes, {
    busqueda, estado, pagina, pageSize: PAGE_SIZE,
  }), [solicitudes, busqueda, estado, pagina])
  const estados = useMemo(() => [...new Set(solicitudes.map((solicitud) => solicitud.estado))].sort(), [solicitudes])

  if (isLoading) return <p className="estudiante-detalle__mini-status" role="status">Cargando solicitudes del estudiante...</p>
  if (error) return (
    <div className="estudiante-detalle__mini-status estudiante-detalle__mini-status--error" role="alert">
      <p>{error}</p>
      <button type="button" className="sapp-document-action" onClick={() => {
        loadedRef.current = false
        setIsLoading(true)
        setError(null)
        setRetry((value) => value + 1)
      }}>Reintentar</button>
    </div>
  )
  if (solicitudes.length === 0) return <p className="estudiante-detalle__mini-status">No hay solicitudes registradas para este estudiante.</p>

  return (
    <div className="estudiante-detalle__tab-grid">
      <div className="sapp-filters-panel">
        <label className="sapp-filter-field">
          <span>Buscar solicitud</span>
          <input type="search" placeholder="Tipo de solicitud o número" value={busqueda} onChange={(event) => {
            setBusqueda(event.target.value); setPagina(1)
          }} />
        </label>
        <label className="sapp-filter-field">
          <span>Estado</span>
          <select value={estado} onChange={(event) => { setEstado(event.target.value); setPagina(1) }}>
            <option value="">Todos</option>
            {estados.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      {resultado.items.length === 0 ? <p className="estudiante-detalle__mini-status">No hay solicitudes que coincidan con los filtros.</p> : null}
      {resultado.items.map((solicitud) => (
        <SolicitudDocumentosCard key={solicitud.id} solicitud={solicitud} active={active} />
      ))}
      {resultado.totalPages > 1 ? (
        <nav className="estudiante-detalle__solicitudes-pagination" aria-label="Paginación de solicitudes del estudiante">
          <button type="button" className="sapp-document-action" disabled={resultado.page === 1} onClick={() => setPagina(resultado.page - 1)}>Anterior</button>
          <span>Página {resultado.page} de {resultado.totalPages}</span>
          <button type="button" className="sapp-document-action" disabled={resultado.page === resultado.totalPages} onClick={() => setPagina(resultado.page + 1)}>Siguiente</button>
        </nav>
      ) : null}
    </div>
  )
}

export default SolicitudesDocumentosEstudiante
