import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import {
  getAdmisionesByEstudiante,
  getMatriculasByEstudiante,
  getSolicitudesByEstudiante,
} from '../../modules/estudiantes/services/estudianteDetalleService'
import { getEstudianteById } from '../../modules/estudiantes/services/estudiantesMockService'
import type {
  AdmisionResumen,
  DocumentoResumen,
  EstudianteCoordinacion,
  MatriculaResumen,
  SolicitudResumen,
} from '../../modules/estudiantes/types'
import './EstudianteDetalleCoordinacionPage.css'

const formatDate = (value: string | null) => {
  if (!value) {
    return '—'
  }

  const parsedDate = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'America/Bogota',
  }).format(parsedDate)
}

const formatEstado = (estado: EstudianteCoordinacion['estadoAcademico']) => {
  const normalized = estado.trim().toUpperCase()

  if (normalized === '1') {
    return 'activo'
  }

  return normalized.replaceAll('_', ' ').toLowerCase()
}

type DetalleTab = 'MATRICULAS' | 'ADMISION' | 'SOLICITUDES'

const TAB_OPTIONS: { id: DetalleTab; label: string }[] = [
  { id: 'MATRICULAS', label: 'Matrículas' },
  { id: 'ADMISION', label: 'Admisión' },
  { id: 'SOLICITUDES', label: 'Solicitudes' },
]

const renderDocumentos = (documentos: DocumentoResumen[]) => {
  if (documentos.length === 0) {
    return <p className="estudiante-detalle__mini-status">No hay documentos registrados.</p>
  }

  return (
    <ul className="estudiante-detalle__docs-list">
      {documentos.map((documento) => (
        <li key={`${documento.idTipoDocumentoTramite}-${documento.codigoTipoDocumentoTramite}`}>
          <strong>{documento.nombreTipoDocumentoTramite}</strong>
          <span>
            {documento.documentoCargado && documento.documentoUploadedResponse
              ? `Cargado: ${documento.documentoUploadedResponse.nombreArchivoDocumento}`
              : 'Pendiente por cargar'}
          </span>
        </li>
      ))}
    </ul>
  )
}

const EstudianteDetalleCoordinacionPage = () => {
  const { estudianteId } = useParams()
  const [tabActiva, setTabActiva] = useState<DetalleTab>('MATRICULAS')
  const [estudiante, setEstudiante] = useState<EstudianteCoordinacion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingTabs, setIsLoadingTabs] = useState(false)
  const [tabsError, setTabsError] = useState<string | null>(null)
  const [matriculas, setMatriculas] = useState<MatriculaResumen[]>([])
  const [admisiones, setAdmisiones] = useState<AdmisionResumen[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudResumen[]>([])

  useEffect(() => {
    const id = Number(estudianteId)

    if (Number.isNaN(id)) {
      setError('El estudiante solicitado no es válido.')
      setIsLoading(false)
      return
    }

    const loadEstudiante = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getEstudianteById(id)

        if (!data) {
          setError('No se encontró información para el estudiante seleccionado.')
          return
        }

        setEstudiante(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar el detalle.')
      } finally {
        setIsLoading(false)
      }
    }

    const loadTabsData = async () => {
      setIsLoadingTabs(true)
      setTabsError(null)

      try {
        const [matriculasData, admisionesData, solicitudesData] = await Promise.all([
          getMatriculasByEstudiante(id),
          getAdmisionesByEstudiante(id),
          getSolicitudesByEstudiante(id),
        ])

        setMatriculas(matriculasData)
        setAdmisiones(admisionesData)
        setSolicitudes(solicitudesData)
      } catch (err) {
        setTabsError(
          err instanceof Error
            ? err.message
            : 'No fue posible cargar la información complementaria del estudiante.',
        )
      } finally {
        setIsLoadingTabs(false)
      }
    }

    void loadEstudiante()
    void loadTabsData()
  }, [estudianteId])

  const contenidoTab = useMemo(() => {
    if (isLoadingTabs) {
      return <p className="estudiante-detalle__mini-status">Cargando información de la pestaña...</p>
    }

    if (tabsError) {
      return (
        <p className="estudiante-detalle__mini-status estudiante-detalle__mini-status--error">{tabsError}</p>
      )
    }

    if (tabActiva === 'MATRICULAS') {
      if (matriculas.length === 0) {
        return <p className="estudiante-detalle__mini-status">No hay matrículas registradas.</p>
      }

      return (
        <div className="estudiante-detalle__tab-grid">
          {matriculas.map((matricula) => (
            <article key={matricula.id} className="estudiante-detalle__tab-card">
              <h3>Matrícula #{matricula.id}</h3>
              <p>Periodo: {matricula.periodoAcademico}</p>
              <p>Estado: {matricula.estado}</p>
              <p>Fecha solicitud: {formatDate(matricula.fechaSolicitud)}</p>
              {renderDocumentos(matricula.documentos)}
            </article>
          ))}
        </div>
      )
    }

    if (tabActiva === 'ADMISION') {
      if (admisiones.length === 0) {
        return <p className="estudiante-detalle__mini-status">No hay procesos de admisión registrados.</p>
      }

      return (
        <div className="estudiante-detalle__tab-grid">
          {admisiones.map((admision) => (
            <article key={admision.id} className="estudiante-detalle__tab-card">
              <h3>Admisión #{admision.id}</h3>
              <p>Estado: {admision.estado}</p>
              <p>Fecha inscripción: {formatDate(admision.fechaInscripcion)}</p>
              <p>Fecha resultado: {formatDate(admision.fechaResultado)}</p>
              <p>Puntaje total: {admision.puntajeTotal ?? '—'}</p>
              {renderDocumentos(admision.documentos)}
            </article>
          ))}
        </div>
      )
    }

    if (solicitudes.length === 0) {
      return <p className="estudiante-detalle__mini-status">No hay solicitudes registradas.</p>
    }

    return (
      <div className="estudiante-detalle__tab-grid">
        {solicitudes.map((solicitud) => (
          <article key={solicitud.id} className="estudiante-detalle__tab-card">
            <h3>Solicitud #{solicitud.id}</h3>
            <p>Tipo: {solicitud.tipoSolicitud}</p>
            <p>Estado: {solicitud.estado}</p>
            <p>Fecha registro: {formatDate(solicitud.fechaRegistro)}</p>
            {renderDocumentos(solicitud.documentos)}
          </article>
        ))}
      </div>
    )
  }, [admisiones, isLoadingTabs, matriculas, solicitudes, tabActiva, tabsError])

  return (
    <ModuleLayout title="Estudiantes">
      <section className="estudiante-detalle">
        <Link to="/coordinacion/estudiantes" className="estudiante-detalle__back">
          ← Volver al listado
        </Link>

        {isLoading ? <p className="estudiante-detalle__status">Cargando información...</p> : null}

        {!isLoading && error ? (
          <p className="estudiante-detalle__status estudiante-detalle__status--error">{error}</p>
        ) : null}

        {!isLoading && estudiante ? (
          <article className="estudiante-detalle__card">
            <header className="estudiante-detalle__header">
              <h1 className="estudiante-detalle__title">{estudiante.nombreCompleto}</h1>
              <p className="estudiante-detalle__subtitle">{estudiante.programaNombre}</p>
            </header>

            <div className="estudiante-detalle__grid">
              <div>
                <span className="estudiante-detalle__label">Código</span>
                <span className="estudiante-detalle__value">{estudiante.codigo}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Documento</span>
                <span className="estudiante-detalle__value">
                  {estudiante.tipoDocumento} {estudiante.numeroDocumento}
                </span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Correo institucional</span>
                <span className="estudiante-detalle__value estudiante-detalle__value--break">
                  {estudiante.correoInstitucional}
                </span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Estado académico</span>
                <span className="estudiante-detalle__value">{formatEstado(estudiante.estadoAcademico)}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Cohorte</span>
                <span className="estudiante-detalle__value">{estudiante.cohorte}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Fecha de ingreso</span>
                <span className="estudiante-detalle__value">{formatDate(estudiante.fechaIngreso)}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Promedio acumulado</span>
                <span className="estudiante-detalle__value">{estudiante.promedioAcumulado.toFixed(2)}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Créditos aprobados</span>
                <span className="estudiante-detalle__value">{estudiante.creditosAprobados}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Créditos pendientes</span>
                <span className="estudiante-detalle__value">{estudiante.creditosPendientes}</span>
              </div>
            </div>

            <section className="estudiante-detalle__tabs" aria-label="Detalle de trámites del estudiante">
              <div className="estudiante-detalle__tab-list" role="tablist" aria-label="Pestañas de trámites">
                {TAB_OPTIONS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    className={`estudiante-detalle__tab-button ${tabActiva === tab.id ? 'is-active' : ''}`}
                    aria-selected={tabActiva === tab.id}
                    onClick={() => setTabActiva(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="estudiante-detalle__tab-panel" role="tabpanel">
                {contenidoTab}
              </div>
            </section>
          </article>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default EstudianteDetalleCoordinacionPage
