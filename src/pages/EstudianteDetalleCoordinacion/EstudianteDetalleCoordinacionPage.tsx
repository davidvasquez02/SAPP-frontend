import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { downloadBase64File, openBase64InNewTab } from '../../shared/files/base64FileUtils'
import {
  getAdmisionesByAspirante,
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

const EMPTY_VALUE = '—'

const formatDate = (value?: string | null) => {
  if (!value) {
    return EMPTY_VALUE
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

const formatEstado = (estado?: EstudianteCoordinacion['estadoAcademico'] | string | null) => {
  const normalized = estado?.trim().toUpperCase()

  if (!normalized) {
    return EMPTY_VALUE
  }

  if (normalized === '1') {
    return 'ACTIVO'
  }

  return normalized.replaceAll('_', ' ')
}

const getProgramaDisplay = (estudiante: EstudianteCoordinacion) => {
  const programa = estudiante.programaNombre?.trim()

  if (!programa) {
    return EMPTY_VALUE
  }

  const codigoAfterDash = programa.split('-').at(-1)?.trim()
  if (codigoAfterDash && /^[A-ZÁÉÍÓÚÑ]{2,8}$/.test(codigoAfterDash)) {
    return codigoAfterDash
  }

  if (programa.toUpperCase().includes('DOCTORADO')) {
    return 'DCC'
  }

  if (programa.toUpperCase().includes('MAESTR')) {
    return 'MISI'
  }

  return programa
}

const getFotoSrc = (estudiante: EstudianteCoordinacion) => {
  const contenidoBase64 = estudiante.foto?.contenidoBase64?.trim()

  if (contenidoBase64) {
    return `data:image/png;base64,${contenidoBase64}`
  }

  return estudiante.fotoUrl
}

type DetalleTab = 'MATRICULAS' | 'ADMISION' | 'SOLICITUDES'

const TAB_OPTIONS: { id: DetalleTab; label: string }[] = [
  { id: 'MATRICULAS', label: 'Matrículas' },
  { id: 'ADMISION', label: 'Admisión' },
  { id: 'SOLICITUDES', label: 'Solicitudes' },
]

const resolveDocumentoContenido = (documento: DocumentoResumen) => {
  const uploaded = documento.documentoUploadedResponse
  return {
    base64: uploaded?.base64DocumentoContenido ?? uploaded?.contenidoBase64,
    mimeType: uploaded?.mimeTypeDocumentoContenido ?? uploaded?.mimeType ?? 'application/pdf',
    filename: uploaded?.nombreArchivoDocumento ?? 'documento.pdf',
  }
}

const getDocumentoEstado = (documento: DocumentoResumen) => {
  const estado = documento.documentoUploadedResponse?.estado?.trim()

  if (estado) {
    return estado.replaceAll('_', ' ')
  }

  return documento.documentoCargado ? 'Cargado' : 'Pendiente'
}

const getDocumentoEstadoModifier = (estado: string) => {
  const normalized = estado.trim().toUpperCase()

  if (normalized.includes('APROB')) {
    return 'is-approved'
  }

  if (normalized.includes('RECHAZ')) {
    return 'is-rejected'
  }

  if (normalized.includes('PEND')) {
    return 'is-pending'
  }

  return 'is-loaded'
}

interface DocumentCardProps {
  documento: DocumentoResumen
}

const DocumentCard = ({ documento }: DocumentCardProps) => {
  const { base64, mimeType, filename } = resolveDocumentoContenido(documento)
  const canOpenActions = Boolean(documento.documentoCargado && base64)
  const estado = getDocumentoEstado(documento)

  return (
    <article className="estudiante-detalle__document-card">
      <header className="estudiante-detalle__document-header">
        <span className="estudiante-detalle__document-icon" aria-hidden="true">
          📄
        </span>
        <h4>{documento.nombreTipoDocumentoTramite || 'Documento requerido'}</h4>
        <span className={`estudiante-detalle__badge estudiante-detalle__badge--document ${getDocumentoEstadoModifier(estado)}`}>
          {estado}
        </span>
      </header>

      <div className="estudiante-detalle__document-body">
        <span className="estudiante-detalle__document-label">Archivo</span>
        <p className={canOpenActions ? '' : 'is-muted'}>
          {canOpenActions ? filename : 'No se ha cargado archivo'}
        </p>
      </div>

      <footer className="estudiante-detalle__document-actions">
        {canOpenActions ? (
          <>
            <button type="button" onClick={() => openBase64InNewTab(base64 as string, mimeType, filename)}>
              Ver
            </button>
            <button type="button" onClick={() => downloadBase64File(base64 as string, mimeType, filename)}>
              Descargar
            </button>
          </>
        ) : (
          <span className="estudiante-detalle__document-no-actions">Acciones disponibles al cargar el archivo</span>
        )}
      </footer>
    </article>
  )
}

const DocumentGrid = ({ documentos }: { documentos: DocumentoResumen[] }) => {
  if (documentos.length === 0) {
    return <p className="estudiante-detalle__mini-status">No hay documentos registrados.</p>
  }

  return (
    <div className="estudiante-detalle__documents-grid">
      {documentos.map((documento) => (
        <DocumentCard
          key={`${documento.idTipoDocumentoTramite}-${documento.codigoTipoDocumentoTramite}`}
          documento={documento}
        />
      ))}
    </div>
  )
}

const StudentProfileHeader = ({ estudiante }: { estudiante: EstudianteCoordinacion }) => {
  const fotoSrc = getFotoSrc(estudiante)

  return (
    <article className="estudiante-detalle__profile-card">
      <div className="estudiante-detalle__profile-photo-shell">
        {fotoSrc ? (
          <img
            className="estudiante-detalle__profile-photo"
            src={fotoSrc}
            alt={`Foto de ${estudiante.nombreCompleto}`}
          />
        ) : (
          <div className="estudiante-detalle__profile-placeholder" aria-label="Sin foto">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-3.31 0-6 2.02-6 4.5V20h12v-1.5c0-2.48-2.69-4.5-6-4.5Z" />
            </svg>
            <span>Sin foto</span>
          </div>
        )}
      </div>

      <div className="estudiante-detalle__profile-main">
        <span className="estudiante-detalle__eyebrow">Perfil académico</span>
        <h1 className="estudiante-detalle__title">{estudiante.nombreCompleto || 'Sin información'}</h1>
        <div className="estudiante-detalle__profile-tags" aria-label="Resumen académico">
          <span className="estudiante-detalle__code-pill">Código UIS {estudiante.codigo || EMPTY_VALUE}</span>
          <span className="estudiante-detalle__program-pill">{getProgramaDisplay(estudiante)}</span>
          <span className="estudiante-detalle__badge estudiante-detalle__badge--status">
            {formatEstado(estudiante.estadoAcademico)}
          </span>
        </div>
      </div>

      <dl className="estudiante-detalle__profile-meta">
        <div>
          <dt>Cohorte</dt>
          <dd>{estudiante.cohorte || EMPTY_VALUE}</dd>
        </div>
        <div>
          <dt>Correo institucional</dt>
          <dd>{estudiante.correoInstitucional || 'Sin información'}</dd>
        </div>
        <div>
          <dt>Documento</dt>
          <dd>
            {estudiante.tipoDocumento || EMPTY_VALUE} {estudiante.numeroDocumento || ''}
          </dd>
        </div>
      </dl>
    </article>
  )
}

const StudentAcademicStats = ({ estudiante }: { estudiante: EstudianteCoordinacion }) => {
  const stats = [
    { label: 'Documento', value: `${estudiante.tipoDocumento || EMPTY_VALUE} ${estudiante.numeroDocumento || ''}`.trim(), icon: '▤' },
    { label: 'Estado académico', value: formatEstado(estudiante.estadoAcademico), icon: '●' },
    { label: 'Fecha de ingreso', value: formatDate(estudiante.fechaIngreso), icon: '↳' },
    { label: 'Fecha de egreso', value: formatDate(estudiante.fechaEgreso), icon: '↱' },
    { label: 'Promedio acumulado', value: estudiante.promedioAcumulado?.toFixed(2) ?? EMPTY_VALUE, icon: '★' },
    { label: 'Créditos aprobados', value: String(estudiante.creditosAprobados ?? EMPTY_VALUE), icon: '✓' },
    { label: 'Créditos pendientes', value: String(estudiante.creditosPendientes ?? EMPTY_VALUE), icon: '…' },
    { label: 'Cohorte', value: estudiante.cohorte || EMPTY_VALUE, icon: '♙' },
  ]

  return (
    <section className="estudiante-detalle__stats-grid" aria-label="Datos académicos del estudiante">
      {stats.map((stat) => (
        <article key={stat.label} className="estudiante-detalle__stat-card">
          <span className="estudiante-detalle__stat-icon" aria-hidden="true">{stat.icon}</span>
          <div>
            <span className="estudiante-detalle__label">{stat.label}</span>
            <strong className="estudiante-detalle__value">{stat.value || EMPTY_VALUE}</strong>
          </div>
        </article>
      ))}
    </section>
  )
}

interface StudentDetailTabsProps {
  activeTab: DetalleTab
  onChange: (tab: DetalleTab) => void
  children: ReactNode
}

const StudentDetailTabs = ({ activeTab, onChange, children }: StudentDetailTabsProps) => (
  <section className="estudiante-detalle__tabs" aria-label="Detalle de trámites del estudiante">
    <div className="estudiante-detalle__tab-list" role="tablist" aria-label="Pestañas de trámites">
      {TAB_OPTIONS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={`estudiante-detalle__tab-button ${activeTab === tab.id ? 'is-active' : ''}`}
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>

    <div className="estudiante-detalle__tab-panel" role="tabpanel">
      {children}
    </div>
  </section>
)

const AdmissionSummaryCard = ({ admision }: { admision: AdmisionResumen }) => (
  <article className="estudiante-detalle__admission-card">
    <header className="estudiante-detalle__admission-header">
      <div>
        <span className="estudiante-detalle__eyebrow">Proceso de admisión</span>
        <h3>Admisión #{admision.id}</h3>
      </div>
      <span className="estudiante-detalle__badge estudiante-detalle__badge--status">
        {formatEstado(admision.estado)}
      </span>
    </header>

    <div className="estudiante-detalle__admission-grid">
      <div>
        <span className="estudiante-detalle__label">Fecha inscripción</span>
        <strong>{formatDate(admision.fechaInscripcion)}</strong>
      </div>
      <div>
        <span className="estudiante-detalle__label">Fecha resultado</span>
        <strong>{formatDate(admision.fechaResultado)}</strong>
      </div>
      <div>
        <span className="estudiante-detalle__label">Puntaje total</span>
        <strong>{admision.puntajeTotal ?? EMPTY_VALUE}</strong>
      </div>
    </div>
  </article>
)

type EstudianteDetalleLocationState = {
  estudiante?: EstudianteCoordinacion
} | null

const EstudianteDetalleCoordinacionPage = () => {
  const { estudianteId } = useParams()
  const location = useLocation()
  const estudianteFromState = (location.state as EstudianteDetalleLocationState)?.estudiante ?? null
  const [tabActiva, setTabActiva] = useState<DetalleTab>('MATRICULAS')
  const [estudiante, setEstudiante] = useState<EstudianteCoordinacion | null>(estudianteFromState)
  const [isLoading, setIsLoading] = useState(!estudianteFromState)
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

    const loadTabsData = async (estudianteData: EstudianteCoordinacion) => {
      setIsLoadingTabs(true)
      setTabsError(null)

      try {
        const admisionesPromise = estudianteData.idAspirante
          ? getAdmisionesByAspirante(estudianteData.idAspirante)
          : Promise.resolve([])
        const [matriculasData, admisionesData, solicitudesData] = await Promise.all([
          getMatriculasByEstudiante(id),
          admisionesPromise,
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

    const loadEstudiante = async () => {
      const stateEstudiante = estudianteFromState?.id === id ? estudianteFromState : null

      if (stateEstudiante) {
        setEstudiante(stateEstudiante)
        setIsLoading(false)
        void loadTabsData(stateEstudiante)
      } else {
        setIsLoading(true)
      }

      setError(null)

      try {
        const data = await getEstudianteById(id)

        if (!data) {
          if (!stateEstudiante) {
            setError('No se encontró información para el estudiante seleccionado.')
          }
          return
        }

        setEstudiante(data)
        if (!stateEstudiante) {
          await loadTabsData(data)
        }
      } catch (err) {
        if (!stateEstudiante) {
          setError(err instanceof Error ? err.message : 'No fue posible cargar el detalle.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadEstudiante()
  }, [estudianteFromState, estudianteId])

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
              <header className="estudiante-detalle__tab-card-header">
                <h3>Matrícula</h3>
                <span className="estudiante-detalle__badge estudiante-detalle__badge--neutral">{matricula.estado}</span>
              </header>
              <div className="estudiante-detalle__tab-card-meta">
                <p>Periodo: {matricula.periodoAcademico}</p>
                <p>Fecha solicitud: {formatDate(matricula.fechaSolicitud)}</p>
              </div>
              <DocumentGrid documentos={matricula.documentos} />
            </article>
          ))}
        </div>
      )
    }

    if (tabActiva === 'ADMISION') {
      if (!estudiante?.idAspirante) {
        return <p className="estudiante-detalle__mini-status">No hay aspirante asociado para este estudiante.</p>
      }

      if (admisiones.length === 0) {
        return <p className="estudiante-detalle__mini-status">No hay procesos de admisión registrados.</p>
      }

      return (
        <div className="estudiante-detalle__admission-section">
          {admisiones.map((admision) => (
            <section key={admision.id} className="estudiante-detalle__admission-group">
              <AdmissionSummaryCard admision={admision} />
              <div className="estudiante-detalle__documents-section">
                <h3>Documentos de admisión</h3>
                <DocumentGrid documentos={admision.documentos} />
              </div>
            </section>
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
            <header className="estudiante-detalle__tab-card-header">
              <h3>Solicitud #{solicitud.id}</h3>
              <span className="estudiante-detalle__badge estudiante-detalle__badge--neutral">{solicitud.estado}</span>
            </header>
            <div className="estudiante-detalle__tab-card-meta">
              <p>Tipo: {solicitud.tipoSolicitud}</p>
              <p>Fecha registro: {formatDate(solicitud.fechaRegistro)}</p>
            </div>
            <DocumentGrid documentos={solicitud.documentos} />
          </article>
        ))}
      </div>
    )
  }, [admisiones, estudiante?.idAspirante, isLoadingTabs, matriculas, solicitudes, tabActiva, tabsError])

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

        {estudiante ? (
          <div className="estudiante-detalle__dashboard">
            <StudentProfileHeader estudiante={estudiante} />
            <StudentAcademicStats estudiante={estudiante} />
            <StudentDetailTabs activeTab={tabActiva} onChange={setTabActiva}>
              {contenidoTab}
            </StudentDetailTabs>
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default EstudianteDetalleCoordinacionPage
