import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { uploadDocument } from '../../api/documentUploadService'
import { useAuth } from '../../context/Auth'
import { fileToBase64 } from '../../utils/fileToBase64'
import { sha256Hex } from '../../utils/sha256'
import { downloadBase64File, openBase64InNewTab } from '../../shared/files/base64FileUtils'
import {
  getDocumentById,
  getDocumentsByEstudiante,
  type DocumentoEstudianteMetadataDto,
  type DocumentosEstudianteGrupoDto,
} from '../../modules/documentos/api/documentosService'
import { getEstudianteById } from '../../modules/estudiantes/services/estudiantesMockService'
import { clearEstudiantesListCache } from '../../modules/estudiantes/services/estudiantesListCache'
import type { EstudianteCoordinacion } from '../../modules/estudiantes/types'
import './EstudianteDetalleCoordinacionPage.css'

const EMPTY_VALUE = '—'
const SIN_PERIODO_KEY = '__SIN_PERIODO__'
const ADMISSION_TYPES = ['ADMISION_ASPIRANTE', 'ADMISION_COORDINACION'] as const
const ENROLLMENT_TYPES = ['MATRICULA', 'MATRICULA_PRIMERA_VEZ'] as const

type DetalleTab = 'MATRICULAS' | 'ADMISION' | 'SOLICITUDES'
type DocumentAction = 'view' | 'download'

type DocumentCardDocument = DocumentoEstudianteMetadataDto & {
  tramiteId: number | null
  tipoTramite: string | null
}

type EnrollmentDocumentGroup = {
  periodo: string | null
  tipoTramites: string[]
  documentos: DocumentCardDocument[]
}

type ActiveDocumentAction = {
  documentoId: number
  action: DocumentAction
} | null

type UploadingDocumentAction = {
  key: string
  filename: string
} | null

const TAB_OPTIONS: { id: DetalleTab; label: string }[] = [
  { id: 'MATRICULAS', label: 'Matrículas' },
  { id: 'ADMISION', label: 'Admisión' },
  { id: 'SOLICITUDES', label: 'Solicitudes' },
]

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

const getCodigoEstudianteUis = (estudiante: EstudianteCoordinacion | null) => {
  return estudiante?.codigoEstudianteUis?.trim() || estudiante?.codigo?.trim() || null
}

const normalizeTipoTramite = (tipoTramite?: string | null) => tipoTramite?.trim().toUpperCase() ?? ''

const compareNullableNumber = (left?: number | null, right?: number | null) => {
  const normalizedLeft = left ?? Number.MAX_SAFE_INTEGER
  const normalizedRight = right ?? Number.MAX_SAFE_INTEGER

  return normalizedLeft - normalizedRight
}

const compareDocuments = (left: DocumentoEstudianteMetadataDto, right: DocumentoEstudianteMetadataDto) => {
  const byTipoDocumento = compareNullableNumber(left.tipoDocumentoTramiteId, right.tipoDocumentoTramiteId)
  if (byTipoDocumento !== 0) {
    return byTipoDocumento
  }

  const bySecuencia = compareNullableNumber(left.secuencia, right.secuencia)
  if (bySecuencia !== 0) {
    return bySecuencia
  }

  return compareNullableNumber(left.id, right.id)
}

const parsePeriodo = (periodo: string | null) => {
  if (!periodo) {
    return null
  }

  const match = periodo.trim().match(/^(\d{4})-(\d+)$/)
  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    term: Number(match[2]),
  }
}

const comparePeriodos = (left: string | null, right: string | null) => {
  if (!left && !right) {
    return 0
  }

  if (!left) {
    return 1
  }

  if (!right) {
    return -1
  }

  const parsedLeft = parsePeriodo(left)
  const parsedRight = parsePeriodo(right)

  if (parsedLeft && parsedRight) {
    return parsedLeft.year - parsedRight.year || parsedLeft.term - parsedRight.term
  }

  if (parsedLeft) {
    return -1
  }

  if (parsedRight) {
    return 1
  }

  return left.localeCompare(right, 'es-CO', { numeric: true })
}

const withDocumentContext = (
  documento: DocumentoEstudianteMetadataDto,
  group: DocumentosEstudianteGrupoDto,
): DocumentCardDocument => ({
  ...documento,
  tramiteId: group.tramiteId,
  tipoTramite: group.tipoTramite,
})

const buildAdmissionDocuments = (
  data: DocumentosEstudianteGrupoDto[],
): DocumentCardDocument[] => {
  return ADMISSION_TYPES.flatMap((tipoTramite) =>
    data
      .filter((group) => normalizeTipoTramite(group.tipoTramite) === tipoTramite)
      .flatMap((group) => [...(group.documentos ?? [])]
        .sort(compareDocuments)
        .map((documento) => withDocumentContext(documento, group))),
  )
}

const buildEnrollmentGroups = (
  data: DocumentosEstudianteGrupoDto[],
): EnrollmentDocumentGroup[] => {
  const groupsByPeriodo = new Map<string, EnrollmentDocumentGroup>()

  data
    .filter((group) => ENROLLMENT_TYPES.includes(normalizeTipoTramite(group.tipoTramite) as (typeof ENROLLMENT_TYPES)[number]))
    .forEach((group) => {
      const periodo = group.periodo?.trim() || null
      const key = periodo ?? SIN_PERIODO_KEY
      const existing = groupsByPeriodo.get(key) ?? {
        periodo,
        tipoTramites: [],
        documentos: [],
      }
      const tipoTramite = normalizeTipoTramite(group.tipoTramite)

      if (tipoTramite && !existing.tipoTramites.includes(tipoTramite)) {
        existing.tipoTramites.push(tipoTramite)
      }

      existing.documentos.push(...(group.documentos ?? []).map((documento) => withDocumentContext(documento, group)))
      groupsByPeriodo.set(key, existing)
    })

  return Array.from(groupsByPeriodo.values())
    .map((group) => ({
      ...group,
      documentos: [...group.documentos].sort(compareDocuments),
    }))
    .sort((left, right) => comparePeriodos(left.periodo, right.periodo))
}

const getDocumentoEstado = (documento: DocumentoEstudianteMetadataDto) => {
  const estado = documento.estado?.trim()

  if (estado) {
    return estado.replaceAll('_', ' ')
  }

  return documento.id && documento.nombreArchivo ? 'Cargado' : 'Pendiente'
}

const getDocumentoEstadoModifier = (estado: string) => {
  const normalized = estado.trim().toUpperCase().replaceAll(' ', '_')

  if (normalized.includes('APROBADO')) {
    return 'is-approved'
  }

  if (normalized.includes('RECHAZADO')) {
    return 'is-rejected'
  }

  if (normalized.includes('CARGADO') || normalized.includes('EN_REVISION')) {
    return 'is-loaded'
  }

  if (normalized.includes('PENDIENTE')) {
    return 'is-pending'
  }

  return 'is-neutral'
}

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) {
    return EMPTY_VALUE
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const getUploadDocumentKey = (documento: Pick<DocumentCardDocument, 'tramiteId' | 'tipoDocumentoTramiteId'>) => {
  return `${documento.tramiteId ?? 'sin-tramite'}-${documento.tipoDocumentoTramiteId ?? 'sin-tipo'}`
}

const canUploadDocument = (documento: DocumentCardDocument) => {
  return !documento.id && Boolean(documento.tipoDocumentoTramiteId && documento.tramiteId)
}

const resolveDocumentoKey = (documento: DocumentCardDocument, index: number) => {
  return documento.id
    ? `documento-${documento.id}`
    : `pendiente-${documento.tramiteId ?? 'sin-tramite'}-${documento.tipoDocumentoTramiteId ?? 'sin-tipo'}-${documento.secuencia ?? index}-${index}`
}

interface DocumentCardProps {
  documento: DocumentCardDocument
  activeAction: ActiveDocumentAction
  uploadingAction: UploadingDocumentAction
  onView: (documentoId: number) => void
  onDownload: (documentoId: number) => void
  onUpload: (documento: DocumentCardDocument, file: File) => void
}

const DocumentCard = ({ documento, activeAction, uploadingAction, onView, onDownload, onUpload }: DocumentCardProps) => {
  const estado = getDocumentoEstado(documento)
  const hasFile = Boolean(documento.id && documento.nombreArchivo?.trim())
  const isProcessing = Boolean(activeAction && activeAction.documentoId === documento.id)
  const isViewing = isProcessing && activeAction?.action === 'view'
  const isDownloading = isProcessing && activeAction?.action === 'download'
  const uploadKey = getUploadDocumentKey(documento)
  const uploadEnabled = canUploadDocument(documento)
  const isUploading = uploadingAction?.key === uploadKey

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (file) {
      onUpload(documento, file)
    }
  }

  return (
    <article className="estudiante-detalle__document-card">
      <header className="estudiante-detalle__document-header">
        <span className="estudiante-detalle__document-icon" aria-hidden="true">
          📄
        </span>
        <h4>{documento.tipoDocumento || 'Documento requerido'}</h4>
        <span className={`estudiante-detalle__badge estudiante-detalle__badge--document ${getDocumentoEstadoModifier(estado)}`}>
          {estado}
        </span>
      </header>

      <div className="estudiante-detalle__document-body">
        <span className="estudiante-detalle__document-label">Archivo</span>
        <p className={hasFile ? '' : 'is-muted'}>
          {hasFile ? documento.nombreArchivo : 'No se ha cargado archivo'}
        </p>
        <dl className="estudiante-detalle__document-meta">
          <div>
            <dt>Fecha de carga</dt>
            <dd>{formatDate(documento.fechaCarga)}</dd>
          </div>
          <div>
            <dt>Tamaño</dt>
            <dd>{formatFileSize(documento.tamanoBytes)}</dd>
          </div>
        </dl>
      </div>

      <footer className="estudiante-detalle__document-actions">
        {hasFile && documento.id ? (
          <>
            <button type="button" disabled={isProcessing} onClick={() => onView(documento.id as number)}>
              {isViewing ? 'Abriendo...' : 'Ver'}
            </button>
            <button type="button" disabled={isProcessing} onClick={() => onDownload(documento.id as number)}>
              {isDownloading ? 'Descargando...' : 'Descargar'}
            </button>
          </>
        ) : uploadEnabled ? (
          <label className={`estudiante-detalle__upload-button ${isUploading ? 'is-disabled' : ''}`}>
            {isUploading ? `Cargando ${uploadingAction?.filename ?? 'archivo'}...` : 'Cargar documento'}
            <input
              type="file"
              className="estudiante-detalle__upload-input"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
              disabled={isUploading}
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <span className="estudiante-detalle__document-no-actions">No hay trámite disponible para cargar este archivo</span>
        )}
      </footer>
    </article>
  )
}

interface DocumentGridProps {
  documentos: DocumentCardDocument[]
  emptyMessage: string
  activeAction: ActiveDocumentAction
  uploadingAction: UploadingDocumentAction
  onView: (documentoId: number) => void
  onDownload: (documentoId: number) => void
  onUpload: (documento: DocumentCardDocument, file: File) => void
}

const DocumentGrid = ({ documentos, emptyMessage, activeAction, uploadingAction, onView, onDownload, onUpload }: DocumentGridProps) => {
  if (documentos.length === 0) {
    return <p className="estudiante-detalle__mini-status">{emptyMessage}</p>
  }

  return (
    <div className="estudiante-detalle__documents-grid">
      {documentos.map((documento, index) => (
        <DocumentCard
          key={resolveDocumentoKey(documento, index)}
          documento={documento}
          activeAction={activeAction}
          uploadingAction={uploadingAction}
          onView={onView}
          onDownload={onDownload}
          onUpload={onUpload}
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
          <span className="estudiante-detalle__code-pill">Código UIS {getCodigoEstudianteUis(estudiante) || EMPTY_VALUE}</span>
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
          <dt>Correo personal</dt>
          <dd>{estudiante.correoPersonal || 'Sin información'}</dd>
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
    { label: 'Fecha de ingreso', value: formatDate(estudiante.fechaIngreso), icon: '↳' },
    { label: 'Fecha de egreso', value: formatDate(estudiante.fechaEgreso), icon: '↱' },
    { label: 'Cohorte de ingreso', value: estudiante.cohorte || EMPTY_VALUE, icon: '♙' },
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

type EstudianteDetalleLocationState = {
  estudiante?: EstudianteCoordinacion
} | null

const EstudianteDetalleCoordinacionPage = () => {
  const { estudianteId } = useParams()
  const { session } = useAuth()
  const location = useLocation()
  const estudianteFromState = (location.state as EstudianteDetalleLocationState)?.estudiante ?? null
  const [tabActiva, setTabActiva] = useState<DetalleTab>('MATRICULAS')
  const [estudiante, setEstudiante] = useState<EstudianteCoordinacion | null>(estudianteFromState)
  const [isLoading, setIsLoading] = useState(!estudianteFromState)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [documentActionError, setDocumentActionError] = useState<string | null>(null)
  const [documentGroups, setDocumentGroups] = useState<DocumentosEstudianteGrupoDto[]>([])
  const [activeDocumentAction, setActiveDocumentAction] = useState<ActiveDocumentAction>(null)
  const [uploadingDocumentAction, setUploadingDocumentAction] = useState<UploadingDocumentAction>(null)
  const loadedDocumentsCodeRef = useRef<string | null>(null)

  useEffect(() => () => {
    window.setTimeout(() => {
      if (window.location.pathname !== '/coordinacion/estudiantes') {
        clearEstudiantesListCache()
      }
    }, 0)
  }, [])

  useEffect(() => {
    const id = Number(estudianteId)

    if (Number.isNaN(id)) {
      setError('El estudiante solicitado no es válido.')
      setIsLoading(false)
      return
    }

    const loadEstudiante = async () => {
      const stateEstudiante = estudianteFromState?.id === id ? estudianteFromState : null

      if (stateEstudiante) {
        setEstudiante(stateEstudiante)
        setIsLoading(false)
        setError(null)
        return
      }

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

    void loadEstudiante()
  }, [estudianteFromState, estudianteId])

  const codigoEstudianteUis = getCodigoEstudianteUis(estudiante)

  const usuarioCargaId = useMemo(() => {
    if (session?.kind !== 'SAPP') {
      return null
    }

    const id = Number(session.user.id)
    return Number.isFinite(id) ? id : null
  }, [session])

  const refreshDocumentGroups = useCallback(async () => {
    if (!codigoEstudianteUis) {
      return
    }

    const data = await getDocumentsByEstudiante(codigoEstudianteUis)
    setDocumentGroups(data)
  }, [codigoEstudianteUis])

  useEffect(() => {
    if (!codigoEstudianteUis) {
      setDocumentGroups([])
      setDocumentsError(estudiante ? 'No se encontró código UIS para consultar documentos.' : null)
      return
    }

    if (loadedDocumentsCodeRef.current === codigoEstudianteUis) {
      return
    }

    let ignore = false
    loadedDocumentsCodeRef.current = codigoEstudianteUis
    setIsLoadingDocuments(true)
    setDocumentsError(null)

    const loadDocuments = async () => {
      try {
        const data = await getDocumentsByEstudiante(codigoEstudianteUis)

        if (!ignore) {
          setDocumentGroups(data)
        }
      } catch (err) {
        if (!ignore) {
          loadedDocumentsCodeRef.current = null
          setDocumentGroups([])
          setDocumentsError(
            err instanceof Error
              ? err.message
              : 'No fue posible cargar los documentos del estudiante.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoadingDocuments(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      ignore = true
    }
  }, [codigoEstudianteUis, estudiante])

  const admissionDocuments = useMemo(() => buildAdmissionDocuments(documentGroups), [documentGroups])
  const enrollmentGroups = useMemo(() => buildEnrollmentGroups(documentGroups), [documentGroups])

  const handleDocumentAction = useCallback(async (documentoId: number, action: DocumentAction) => {
    setActiveDocumentAction({ documentoId, action })
    setDocumentActionError(null)

    try {
      const file = await getDocumentById(documentoId)

      if (!file.contenidoBase64) {
        throw new Error('El documento no contiene archivo disponible.')
      }

      const mimeType = file.mimeType || 'application/octet-stream'
      const filename = file.nombreArchivo || `documento-${documentoId}`

      if (action === 'view') {
        openBase64InNewTab(file.contenidoBase64, mimeType, filename)
      } else {
        downloadBase64File(file.contenidoBase64, mimeType, filename)
      }
    } catch (err) {
      setDocumentActionError(
        err instanceof Error
          ? err.message
          : 'No fue posible procesar el documento solicitado.',
      )
    } finally {
      setActiveDocumentAction(null)
    }
  }, [])


  const handleDocumentUpload = useCallback(async (documento: DocumentCardDocument, file: File) => {
    if (!documento.tipoDocumentoTramiteId || !documento.tramiteId) {
      setDocumentActionError('No se encontró el trámite asociado para cargar este documento.')
      return
    }

    if (!usuarioCargaId) {
      setDocumentActionError('No se encontró el usuario SAPP que realiza la carga.')
      return
    }

    const uploadKey = getUploadDocumentKey(documento)
    setUploadingDocumentAction({ key: uploadKey, filename: file.name })
    setDocumentActionError(null)

    try {
      const buffer = await file.arrayBuffer()
      const contenidoBase64 = await fileToBase64(file)
      const checksum = await sha256Hex(buffer)

      await uploadDocument({
        tipoDocumentoTramiteId: documento.tipoDocumentoTramiteId,
        nombreArchivo: file.name,
        tramiteId: documento.tramiteId,
        usuarioCargaId,
        aspiranteCargaId: null,
        contenidoBase64,
        mimeType: file.type || 'application/octet-stream',
        tamanoBytes: file.size,
        checksum,
      })

      await refreshDocumentGroups()
    } catch (err) {
      setDocumentActionError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar el documento seleccionado.',
      )
    } finally {
      setUploadingDocumentAction(null)
    }
  }, [refreshDocumentGroups, usuarioCargaId])

  const contenidoTab = useMemo(() => {
    const withActionError = (content: ReactNode) => (
      <>
        {documentActionError ? (
          <p className="estudiante-detalle__mini-status estudiante-detalle__mini-status--error">{documentActionError}</p>
        ) : null}
        {content}
      </>
    )

    if (isLoadingDocuments) {
      return <p className="estudiante-detalle__mini-status">Cargando documentos del estudiante...</p>
    }

    if (documentsError) {
      return (
        <p className="estudiante-detalle__mini-status estudiante-detalle__mini-status--error">{documentsError}</p>
      )
    }

    if (tabActiva === 'MATRICULAS') {
      if (enrollmentGroups.length === 0) {
        return <p className="estudiante-detalle__mini-status">No hay documentos de matrícula registrados para este estudiante.</p>
      }

      return withActionError(
        <div className="estudiante-detalle__tab-grid">
          {enrollmentGroups.map((group) => (
            <section key={group.periodo ?? SIN_PERIODO_KEY} className="estudiante-detalle__tab-card estudiante-detalle__enrollment-group">
              <header className="estudiante-detalle__tab-card-header">
                <div>
                  <h3>{group.periodo ? `Periodo ${group.periodo}` : 'Matrícula sin periodo'}</h3>
                </div>
                <span className="estudiante-detalle__badge estudiante-detalle__badge--neutral">
                  {group.documentos.length} documento{group.documentos.length === 1 ? '' : 's'}
                </span>
              </header>
              <DocumentGrid
                documentos={group.documentos}
                emptyMessage="No hay documentos de matrícula registrados para este periodo."
                activeAction={activeDocumentAction}
                uploadingAction={uploadingDocumentAction}
                onView={(documentoId) => void handleDocumentAction(documentoId, 'view')}
                onDownload={(documentoId) => void handleDocumentAction(documentoId, 'download')}
                onUpload={(documento, file) => void handleDocumentUpload(documento, file)}
              />
            </section>
          ))}
        </div>,
      )
    }

    if (tabActiva === 'ADMISION') {
      return withActionError(
        <div className="estudiante-detalle__documents-section">
          <h3>Documentos de admisión</h3>
          <DocumentGrid
            documentos={admissionDocuments}
            emptyMessage="No hay documentos de admisión registrados para este estudiante."
            activeAction={activeDocumentAction}
            uploadingAction={uploadingDocumentAction}
            onView={(documentoId) => void handleDocumentAction(documentoId, 'view')}
            onDownload={(documentoId) => void handleDocumentAction(documentoId, 'download')}
            onUpload={(documento, file) => void handleDocumentUpload(documento, file)}
          />
        </div>,
      )
    }

    return withActionError(
      <p className="estudiante-detalle__mini-status">
        La consulta documental de esta pantalla se concentra en Admisión y Matrículas. Las solicitudes académicas no se recargan en este ajuste para evitar llamados documentales duplicados.
      </p>
    )
  }, [activeDocumentAction, admissionDocuments, documentActionError, documentsError, enrollmentGroups, handleDocumentAction, handleDocumentUpload, isLoadingDocuments, tabActiva, uploadingDocumentAction])

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
