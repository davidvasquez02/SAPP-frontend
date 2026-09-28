import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BackButton, ModuleLayout } from '../../components'
import { canManagePosgrados, isEvaluadorAdmision } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import InscripcionAccordionWindow from '../../modules/admisiones/components/InscripcionAccordionWindow/InscripcionAccordionWindow'
import { cambiarEstadoInscripcionVal } from '../../modules/admisiones/api/inscripcionCambioEstadoService'
import {
  getInscripcionByConvocatoriaAndId,
} from '../../modules/admisiones/api/inscripcionAdmisionService'
import { getEvaluacionEstado } from '../../modules/admisiones/api/evaluacionAdmisionEstadoService'
import type { InscripcionAdmisionDto } from '../../modules/admisiones/api/types'
import { invalidateEvaluacionAvailabilityCache } from '../../modules/admisiones/api/evaluacionAdmisionAvailabilityCache'
import {
  calcularPuntajes,
  finalizarEvaluacion,
} from '../../modules/admisiones/api/finalizarEvaluacionService'
import { iniciarEvaluacion } from '../../modules/admisiones/api/iniciarEvaluacionService'
import {
  prefetchEvaluacionEtapa,
  prefetchHojaVidaDocumento,
} from '../../modules/admisiones/pages/EvaluacionEtapaPage/evaluacionPrefetchCache'
import { validateEvaluacionCompleta } from '../../modules/admisiones/utils/validateEvaluacionCompleta'
import { prefetchInscripcionDocumentos } from '../InscripcionDocumentos/documentosPrefetchCache'
import { hasEvaluationDrafts } from '../../modules/admisiones/utils/evaluacionDraftStore'
import './InscripcionAdmisionDetallePage.css'

const INSCRIPCION_SECTIONS = [
  {
    key: 'documentos',
    title: 'Documentos cargados',
    pathSuffix: 'documentos',
  },
  {
    key: 'hoja-vida',
    title: 'Hoja de vida',
    pathSuffix: 'hoja-vida',
  },
  {
    key: 'examen',
    title: 'Examen de conocimiento',
    pathSuffix: 'examen',
  },
  {
    key: 'entrevistas',
    title: 'Entrevistas',
    pathSuffix: 'entrevistas',
  },
] as const

type InscripcionSectionKey = (typeof INSCRIPCION_SECTIONS)[number]['key']
type ActiveWindow = 'DOCUMENTOS' | 'HOJA_VIDA' | 'EXAMEN' | 'ENTREVISTAS' | null
export interface InscripcionDetalleOutletContext {
  isEstadoFinal: boolean
  isEvaluadorOnly: boolean
  evaluacionStatus: 'LOADING' | 'NOT_STARTED' | 'STARTED' | 'ERROR'
  onEvaluacionStarted: () => Promise<void>
}

const formatDisplayDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(date)
}

const getFotoSrc = (inscripcion?: InscripcionAdmisionDto | null) => {
  const foto = inscripcion?.foto
  if (!foto?.contenidoBase64) {
    return null
  }

  if (foto.contenidoBase64.startsWith('data:')) {
    return foto.contenidoBase64
  }

  return `data:${foto.mimeType ?? 'image/jpeg'};base64,${foto.contenidoBase64}`
}

const DISABLED_MESSAGE = 'Disponible cuando se inicie la evaluación.'
const EVALUACION_RETRY_ATTEMPTS = 5
const EVALUACION_RETRY_DELAY_MS = 500

const normalizeEstado = (estado?: string | null) =>
  (estado ?? '').trim().toUpperCase().replace(/\s+/g, '_')

const isEstadoPorValidarDocumentos = (estado?: string | null) => {
  const normalized = normalizeEstado(estado)
  return normalized === 'POR_VALIDAR_DOCUMENTOS'
}

const InscripcionAdmisionDetallePage = () => {
  const { session } = useAuth()
  const { convocatoriaId, inscripcionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [evaluacionStatus, setEvaluacionStatus] = useState<
    'LOADING' | 'NOT_STARTED' | 'STARTED' | 'ERROR'
  >('LOADING')
  const [evaluacionMsg, setEvaluacionMsg] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string[] | null>(null)
  const [finalizeSuccess, setFinalizeSuccess] = useState<string | null>(null)
  const [componentReloadVersion, setComponentReloadVersion] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<InscripcionSectionKey, string>>>({})

  const routeState = useMemo(
    () =>
      (location.state as
        | {
            nombreAspirante?: string
            inscripcionEstado?: string
          }
        | null) ?? null,
    [location.state],
  )

  const [inscripcionEstado, setInscripcionEstado] = useState<string | null>(
    routeState?.inscripcionEstado ?? null,
  )
  const [programaAcademico, setProgramaAcademico] = useState<string | null>(null)
  const [inscripcionDetalle, setInscripcionDetalle] = useState<InscripcionAdmisionDto | null>(null)
  const [isUpdatingInscripcionEstado, setIsUpdatingInscripcionEstado] = useState(false)
  const [inscripcionEstadoWarning, setInscripcionEstadoWarning] = useState<string | null>(null)
  const didCambioEstadoValRef = useRef<Record<number, boolean>>({})
  const evaluadorEntrevistaRequestRef = useRef<{
    inscripcionId: number
    promise: Promise<void>
  } | null>(null)
  const prevActiveRef = useRef<ActiveWindow>(null)
  const finalizeButtonRef = useRef<HTMLButtonElement | null>(null)

  const nombreAspirante = inscripcionDetalle?.nombreAspirante ?? routeState?.nombreAspirante ?? 'Aspirante'
  const pageTitle = 'Inscripción'

  const parsedInscripcionId = useMemo(() => Number(inscripcionId), [inscripcionId])
  const parsedConvocatoriaId = useMemo(() => Number(convocatoriaId), [convocatoriaId])

  const basePath =
    convocatoriaId && inscripcionId
      ? `/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`
      : ''

  const activeKey: InscripcionSectionKey | null =
    INSCRIPCION_SECTIONS.find((section) =>
      location.pathname.endsWith(`/${section.pathSuffix}`),
    )?.key ?? null
  const activeWindow: ActiveWindow = useMemo(() => {
    if (activeKey === 'documentos') {
      return 'DOCUMENTOS'
    }
    if (activeKey === 'hoja-vida') {
      return 'HOJA_VIDA'
    }
    if (activeKey === 'examen') {
      return 'EXAMEN'
    }
    if (activeKey === 'entrevistas') {
      return 'ENTREVISTAS'
    }
    return null
  }, [activeKey])

  const roles = useMemo(() => (session?.kind === 'SAPP' ? session.user.roles : []), [session])
  const isEvaluadorOnly = isEvaluadorAdmision(roles) && !canManagePosgrados(roles)
  const canFinalizeInscripcion = canManagePosgrados(roles)
  const estadoNormalizado = normalizeEstado(inscripcionEstado)
  const isEstadoFinal = estadoNormalizado === 'ADMITIDO' || estadoNormalizado === 'RECHAZADO'
  const canShowFinalizeSection = canFinalizeInscripcion && !isEstadoFinal
  const fotoSrc = getFotoSrc(inscripcionDetalle)
  const documentoAspirante = inscripcionDetalle?.numeroDocumento ?? inscripcionDetalle?.cedula ?? '—'
  const correoAspirante = inscripcionDetalle?.emailPersonal ?? inscripcionDetalle?.correo ?? '—'
  const telefonoAspirante = inscripcionDetalle?.telefono ?? '—'
  const codigoInscripcion =
    inscripcionDetalle?.numeroInscripcion ??
    (inscripcionDetalle?.id
      ? `INS-${inscripcionDetalle.id}`
      : inscripcionId
        ? `INS-${inscripcionId}`
        : '—')
  const periodoAcademico = inscripcionDetalle?.periodoAcademico ?? '—'
  const fechaInscripcion = formatDisplayDate(inscripcionDetalle?.fechaInscripcion)
  const ultimaActualizacion = formatDisplayDate(inscripcionDetalle?.fechaResultado, {
    hour: '2-digit',
    minute: '2-digit',
  })
  const reloadInscripcionDetalle = useCallback(async () => {
    if (
      !convocatoriaId ||
      !inscripcionId ||
      Number.isNaN(parsedConvocatoriaId) ||
      Number.isNaN(parsedInscripcionId)
    ) {
      return
    }

    try {
      const inscripcion = await getInscripcionByConvocatoriaAndId(
        parsedConvocatoriaId,
        parsedInscripcionId,
      )
      setInscripcionDetalle(inscripcion)
      setInscripcionEstado(inscripcion.estado ?? null)
      setProgramaAcademico(inscripcion.programaAcademico ?? null)
    } catch {
      setInscripcionDetalle(null)
      // Silenciamos el error para no interrumpir la navegación de ventanas.
    }
  }, [convocatoriaId, inscripcionId, parsedConvocatoriaId, parsedInscripcionId])

  useEffect(() => {
    setInscripcionEstadoWarning(null)
    setIsUpdatingInscripcionEstado(false)

    if (routeState?.inscripcionEstado) {
      setInscripcionEstado(routeState.inscripcionEstado)
      return
    }

    setInscripcionEstado(null)
  }, [inscripcionId, routeState?.inscripcionEstado])

  useEffect(() => {
    if (inscripcionEstado) {
      return
    }

    void reloadInscripcionDetalle()
  }, [inscripcionEstado, reloadInscripcionDetalle])

  const loadEvaluacionEstado = useCallback(async () => {
    if (!inscripcionId || Number.isNaN(parsedInscripcionId)) {
      setEvaluacionStatus('ERROR')
      setEvaluacionMsg('No se encontró una inscripción válida para consultar la evaluación.')
      return
    }

    setEvaluacionStatus('LOADING')
    setEvaluacionMsg(null)

    try {
      const estado = await getEvaluacionEstado(parsedInscripcionId)
      if (estado.status === 'NOT_STARTED') {
        setEvaluacionStatus('NOT_STARTED')
        setEvaluacionMsg(estado.message)
        return
      }

      setEvaluacionStatus('STARTED')
      setEvaluacionMsg(null)
      setComponentReloadVersion((prev) => prev + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setEvaluacionStatus('ERROR')
      setEvaluacionMsg(message)
    }
  }, [inscripcionId, parsedInscripcionId])

  const waitForEvaluacionStarted = useCallback(async () => {
    for (let attempt = 0; attempt < EVALUACION_RETRY_ATTEMPTS; attempt += 1) {
      const estado = await getEvaluacionEstado(parsedInscripcionId)
      if (estado.status === 'STARTED') {
        return true
      }

      if (attempt < EVALUACION_RETRY_ATTEMPTS - 1) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, EVALUACION_RETRY_DELAY_MS)
        })
      }
    }

    return false
  }, [parsedInscripcionId])

  const prefetchAllSections = useCallback(async () => {
    const errors: Partial<Record<InscripcionSectionKey, string>> = {}
    await Promise.allSettled([
      prefetchInscripcionDocumentos(parsedInscripcionId).catch((e) => {
        errors.documentos = e instanceof Error ? e.message : 'Error cargando documentos.'
      }),
      prefetchEvaluacionEtapa(parsedInscripcionId, 'HOJA_DE_VIDA')
        .then(() => prefetchHojaVidaDocumento(parsedInscripcionId))
        .catch((e) => {
          errors['hoja-vida'] = e instanceof Error ? e.message : 'Error cargando hoja de vida.'
        }),
      prefetchEvaluacionEtapa(parsedInscripcionId, 'EXAMEN_DE_CONOCIMIENTOS').catch((e) => {
        errors.examen = e instanceof Error ? e.message : 'Error cargando examen.'
      }),
      prefetchEvaluacionEtapa(parsedInscripcionId, 'ENTREVISTA').catch((e) => {
        errors.entrevistas = e instanceof Error ? e.message : 'Error cargando entrevistas.'
      }),
    ])

    setSectionErrors(errors)
  }, [parsedInscripcionId])

  const loadEntrevistaForEvaluador = useCallback(async () => {
    setEvaluacionStatus('LOADING')
    setEvaluacionMsg(null)

    try {
      await prefetchEvaluacionEtapa(parsedInscripcionId, 'ENTREVISTA')
      setSectionErrors({})
      setEvaluacionStatus('STARTED')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setSectionErrors({ entrevistas: message })
      setEvaluacionStatus('ERROR')
      setEvaluacionMsg(message)
    }
  }, [parsedInscripcionId])

  const handleEvaluacionStarted = useCallback(async () => {
    setEvaluacionStatus('STARTED')
    setEvaluacionMsg(null)
    await prefetchAllSections()
    setComponentReloadVersion((prev) => prev + 1)
  }, [prefetchAllSections])

  useEffect(() => {
    if (Number.isNaN(parsedInscripcionId)) {
      setIsInitialLoading(false)
      return
    }

    void (async () => {
      setIsInitialLoading(true)
      if (isEvaluadorOnly) {
        // DOCENTE/PROFESOR/DIRECTOR solo necesitan la entrevista. Esta consulta
        // también alimenta el caché que consume EvaluacionEtapaPage, evitando
        // consultar las otras etapas y el endpoint general de evaluación.
        if (evaluadorEntrevistaRequestRef.current?.inscripcionId !== parsedInscripcionId) {
          evaluadorEntrevistaRequestRef.current = {
            inscripcionId: parsedInscripcionId,
            promise: Promise.all([
              loadEntrevistaForEvaluador(),
              reloadInscripcionDetalle(),
            ]).then(() => undefined),
          }
        }
        await evaluadorEntrevistaRequestRef.current.promise
      } else {
        await Promise.all([loadEvaluacionEstado(), reloadInscripcionDetalle()])
        await prefetchAllSections()
      }
      setIsInitialLoading(false)
    })()
  }, [
    isEvaluadorOnly,
    loadEntrevistaForEvaluador,
    loadEvaluacionEstado,
    parsedInscripcionId,
    prefetchAllSections,
    reloadInscripcionDetalle,
  ])

  useEffect(() => {
    if (!isEvaluadorOnly || !basePath) {
      return
    }

    if (evaluacionStatus !== 'STARTED') {
      return
    }

    if (activeKey !== 'entrevistas') {
      navigate(`${basePath}/entrevistas`, { replace: true })
    }
  }, [activeKey, basePath, evaluacionStatus, isEvaluadorOnly, navigate])

  useEffect(() => {
    const previousActiveWindow = prevActiveRef.current
    prevActiveRef.current = activeWindow

    const isOpeningDocs =
      activeWindow === 'DOCUMENTOS' && previousActiveWindow !== 'DOCUMENTOS'

    if (!isOpeningDocs) {
      return
    }

    const hasValidInscripcionId = !Number.isNaN(parsedInscripcionId)
    const isPorValidarDocumentos = isEstadoPorValidarDocumentos(inscripcionEstado)
    const alreadyTriggered = hasValidInscripcionId
      ? Boolean(didCambioEstadoValRef.current[parsedInscripcionId])
      : false

    if (import.meta.env.DEV) {
      console.debug('[INSCRIPCION_ESTADO] open DOCUMENTOS detected', {
        inscripcionId: hasValidInscripcionId ? parsedInscripcionId : null,
        estado: inscripcionEstado,
        isPorValidarDocumentos,
        alreadyTriggered,
      })
    }

    if (!hasValidInscripcionId) {
      return
    }

    if (!isPorValidarDocumentos) {
      if (import.meta.env.DEV) {
        console.debug('[INSCRIPCION_ESTADO] skip cambioEstadoVal', {
          reason: 'not_por_validar_documentos',
          inscripcionId: parsedInscripcionId,
        })
      }
      return
    }

    if (alreadyTriggered) {
      if (import.meta.env.DEV) {
        console.debug('[INSCRIPCION_ESTADO] skip cambioEstadoVal', {
          reason: 'already_triggered',
          inscripcionId: parsedInscripcionId,
        })
      }
      return
    }

    setInscripcionEstadoWarning(null)
    setIsUpdatingInscripcionEstado(true)

    void (async () => {
      try {
        if (import.meta.env.DEV) {
          console.debug('[INSCRIPCION_ESTADO] calling PUT cambioEstadoVal', {
            inscripcionId: parsedInscripcionId,
          })
        }
        await cambiarEstadoInscripcionVal(parsedInscripcionId)
        didCambioEstadoValRef.current[parsedInscripcionId] = true
        if (import.meta.env.DEV) {
          console.debug('[INSCRIPCION_ESTADO] cambioEstadoVal OK', {
            inscripcionId: parsedInscripcionId,
          })
        }
        await reloadInscripcionDetalle()
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[INSCRIPCION_ESTADO] cambioEstadoVal ERROR', {
            inscripcionId: parsedInscripcionId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
        setInscripcionEstadoWarning('No se pudo actualizar el estado de la inscripción.')
      } finally {
        setIsUpdatingInscripcionEstado(false)
      }
    })()
  }, [activeWindow, inscripcionEstado, parsedInscripcionId, reloadInscripcionDetalle])

  const handleIniciarEvaluacion = useCallback(async () => {
    if (!inscripcionId || Number.isNaN(parsedInscripcionId)) {
      setEvaluacionMsg('No se encontró una inscripción válida para iniciar evaluación.')
      setEvaluacionStatus('ERROR')
      return
    }

    setStarting(true)
    setEvaluacionMsg(null)
    try {
      await iniciarEvaluacion(parsedInscripcionId)
      invalidateEvaluacionAvailabilityCache(parsedInscripcionId)
      const isStarted = await waitForEvaluacionStarted()
      if (isStarted) {
        await handleEvaluacionStarted()
      } else {
        await loadEvaluacionEstado()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setEvaluacionStatus('ERROR')
      setEvaluacionMsg(message)
    } finally {
      setStarting(false)
    }
  }, [handleEvaluacionStarted, inscripcionId, loadEvaluacionEstado, parsedInscripcionId, waitForEvaluacionStarted])

  const handleFinalizarInscripcion = useCallback(async () => {
    if (!inscripcionId || Number.isNaN(parsedInscripcionId)) {
      setFinalizeError(['No se encontró una inscripción válida para finalizar.'])
      return
    }

    setIsFinalizeDialogOpen(false)
    setFinalizing(true)
    setFinalizeError(null)
    setFinalizeSuccess(null)

    try {
      const validation = await validateEvaluacionCompleta(parsedInscripcionId)
      if ('reasons' in validation) {
        setFinalizeError(validation.reasons)
        return
      }

      await calcularPuntajes(parsedInscripcionId)
      await finalizarEvaluacion(parsedInscripcionId)
      invalidateEvaluacionAvailabilityCache(parsedInscripcionId)
      await Promise.all([loadEvaluacionEstado(), reloadInscripcionDetalle()])
      setFinalizeSuccess('Inscripción finalizada correctamente.')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setFinalizeError([message])
    } finally {
      setFinalizing(false)
    }
  }, [
    inscripcionId,
    loadEvaluacionEstado,
    parsedInscripcionId,
    reloadInscripcionDetalle,
  ])

  const closeFinalizeDialog = useCallback(() => {
    if (finalizing) {
      return
    }

    setIsFinalizeDialogOpen(false)
    window.requestAnimationFrame(() => finalizeButtonRef.current?.focus())
  }, [finalizing])

  useEffect(() => {
    if (!isFinalizeDialogOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFinalizeDialog()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeFinalizeDialog, isFinalizeDialogOpen])

  const sectionAvailability = useMemo<Record<InscripcionSectionKey, boolean>>(
    () => ({
      documentos: true,
      'hoja-vida': evaluacionStatus === 'STARTED',
      examen: evaluacionStatus === 'STARTED',
      entrevistas: evaluacionStatus === 'STARTED',
    }),
    [evaluacionStatus],
  )

  const handleToggle = useCallback(
    (sectionKey: InscripcionSectionKey) => {
      if (!basePath) {
        return
      }

      if (!sectionAvailability[sectionKey]) {
        return
      }

      if (
        !Number.isNaN(parsedInscripcionId) &&
        hasEvaluationDrafts(parsedInscripcionId) &&
        !window.confirm('Hay calificaciones sin guardar. Puedes cambiar de sección sin perderlas. ¿Deseas continuar?')
      ) {
        return
      }

      if (activeKey === sectionKey) {
        navigate(basePath)
        return
      }

      const section = INSCRIPCION_SECTIONS.find((item) => item.key === sectionKey)
      if (!section) {
        return
      }

      navigate(`${basePath}/${section.pathSuffix}`)
    },
    [activeKey, basePath, navigate, parsedInscripcionId, sectionAvailability],
  )

  const outlet = (
    <Outlet
      context={{
        isEstadoFinal,
        isEvaluadorOnly,
        evaluacionStatus,
        onEvaluacionStarted: handleEvaluacionStarted,
      } satisfies InscripcionDetalleOutletContext}
    />
  )
  const sectionsToRender = isEvaluadorOnly
    ? INSCRIPCION_SECTIONS.filter((section) => section.key === 'entrevistas')
    : INSCRIPCION_SECTIONS
  const backDestination = isEvaluadorOnly
    ? '/admisiones'
    : `/admisiones/convocatoria/${convocatoriaId}`
  const [isProfileMetaExpanded, setIsProfileMetaExpanded] = useState(false)

  return (
    <ModuleLayout title="Admisiones">
      <section className="inscripcion-detalle">
        <BackButton to={backDestination}>
          {isEvaluadorOnly ? 'Volver a inscripciones' : 'Volver a convocatoria'}
        </BackButton>

        <h1 className="inscripcion-detalle__title">{pageTitle}</h1>

        <section className="inscripcion-detalle__profile-card" aria-label="Resumen del aspirante">
          <div className="inscripcion-detalle__profile-photo">
            {fotoSrc ? (
              <img src={fotoSrc} alt={`Foto de ${nombreAspirante}`} />
            ) : (
              <span aria-hidden="true">👤</span>
            )}
          </div>

          <div className="inscripcion-detalle__profile-info">
            <div className="inscripcion-detalle__profile-heading">
              <h2>{nombreAspirante}</h2>
              {inscripcionEstado ? (
                <span className={`inscripcion-detalle__state inscripcion-detalle__state--${estadoNormalizado.replace(/_/g, '-')}`}>
                  {inscripcionEstado.replaceAll('_', ' ')}
                </span>
              ) : null}
            </div>
            <div className="inscripcion-detalle__contact-grid">
              <span>Documento: <strong>{documentoAspirante}</strong></span>
              <span>Correo: <strong>{correoAspirante}</strong></span>
              <span>Teléfono: <strong>{telefonoAspirante}</strong></span>
            </div>
          </div>

          <div className={`inscripcion-detalle__profile-meta${isProfileMetaExpanded ? ' inscripcion-detalle__profile-meta--expanded' : ''}`}>
            <button
              type="button"
              className="inscripcion-detalle__profile-meta-toggle"
              aria-expanded={isProfileMetaExpanded}
              aria-controls="inscripcion-profile-meta-content"
              onClick={() => setIsProfileMetaExpanded((current) => !current)}
            >
              Datos de la inscripción
            </button>
            <div id="inscripcion-profile-meta-content" className="inscripcion-detalle__profile-meta-content">
              <div className="inscripcion-detalle__meta-item">
                <span>Programa</span>
                <strong>{programaAcademico ?? '—'}</strong>
              </div>
              <div className="inscripcion-detalle__meta-item">
                <span>Código de inscripción</span>
                <strong>{codigoInscripcion}</strong>
              </div>
              <div className="inscripcion-detalle__meta-row">
              <div className="inscripcion-detalle__meta-item">
                <span>Período</span>
                <strong>{periodoAcademico}</strong>
              </div>
              <div className="inscripcion-detalle__meta-item">
                <span>Fecha de inscripción</span>
                <strong>{fechaInscripcion}</strong>
              </div>
              <div className="inscripcion-detalle__meta-item">
                <span>Última actualización</span>
                <strong>{ultimaActualizacion}</strong>
              </div>
              </div>
            </div>
          </div>
        </section>

        <section className="inscripcion-detalle__summary-bar" aria-label="Resumen de inscripción">
          <div className="inscripcion-detalle__summary-item">
            <span className="inscripcion-detalle__summary-icon" aria-hidden="true">✓</span>
            <div>
              <span>Estado de inscripción</span>
              <strong>{inscripcionEstado ? inscripcionEstado.replaceAll('_', ' ') : '—'}</strong>
            </div>
          </div>
        </section>

        {evaluacionStatus === 'ERROR' && evaluacionMsg ? (
          <p className="inscripcion-detalle__alert inscripcion-detalle__alert--error">
            <span aria-hidden="true">⚠️</span>
            {evaluacionMsg}
          </p>
        ) : null}
        {evaluacionStatus === 'NOT_STARTED' && evaluacionMsg ? (
          <p className="inscripcion-detalle__alert inscripcion-detalle__alert--warning">
            <span aria-hidden="true">ⓘ</span>
            {evaluacionMsg}
          </p>
        ) : null}

        {isInitialLoading ? <p className="inscripcion-detalle__alert">Cargando información de secciones…</p> : null}
        <div className="inscripcion-detalle__windows" aria-busy={isInitialLoading}>
          {sectionsToRender.map((section) => {
            const isOpen = activeKey === section.key
            const isEnabled = sectionAvailability[section.key]
            const subtitle = sectionErrors[section.key] ?? (isEnabled ? undefined : DISABLED_MESSAGE)

            return (
              <InscripcionAccordionWindow
                key={section.key}
                title={section.title}
                subtitle={subtitle}
                isOpen={isOpen}
                isDisabled={!isEnabled || isInitialLoading}
                onToggle={() => handleToggle(section.key)}
              >
                {isOpen ? (
                  <>
                    {section.key === 'documentos' ? (
                      <>
                        {isUpdatingInscripcionEstado ? (
                          <p className="inscripcion-detalle__inline-status">
                            Actualizando estado...
                          </p>
                        ) : null}
                        {inscripcionEstadoWarning ? (
                          <p className="inscripcion-detalle__inline-status inscripcion-detalle__inline-status--warning">
                            {inscripcionEstadoWarning}
                          </p>
                        ) : null}
                      </>
                    ) : null}

                    <div key={componentReloadVersion}>{outlet}</div>
                    {section.key === 'documentos' && evaluacionStatus === 'NOT_STARTED' ? (
                      <div className="inscripcion-detalle__start-eval">
                        <p className="inscripcion-detalle__start-eval-text">
                          Habilita Hoja de vida, Examen y Entrevistas.
                        </p>
                        <button
                          type="button"
                          className="inscripcion-detalle__start-eval-button"
                          onClick={() => void handleIniciarEvaluacion()}
                          disabled={starting}
                          aria-disabled={starting}
                        >
                          {starting
                            ? 'Iniciando proceso...'
                            : 'Iniciar proceso de evaluación'}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </InscripcionAccordionWindow>
            )
          })}
        </div>

        {canShowFinalizeSection ? (
          <section className="inscripcion-detalle__finalize">
            <p className="inscripcion-detalle__finalize-text">
              Finaliza la evaluación y calcula puntajes finales.
            </p>
            <button
              ref={finalizeButtonRef}
              type="button"
              className="inscripcion-detalle__finalize-button"
              onClick={() => setIsFinalizeDialogOpen(true)}
              disabled={finalizing || evaluacionStatus !== 'STARTED'}
              title={
                evaluacionStatus !== 'STARTED'
                  ? 'Debe iniciar evaluación primero'
                  : undefined
              }
            >
              {finalizing ? 'Finalizando…' : 'Finalizar inscripción'}
            </button>
            {finalizeError ? (
              <div className="inscripcion-detalle__inline-status inscripcion-detalle__inline-status--error">
                <p className="inscripcion-detalle__error-title">
                  No se pudo finalizar la inscripción:
                </p>
                <ul className="inscripcion-detalle__error-list">
                  {finalizeError.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {finalizeSuccess ? (
              <p className="inscripcion-detalle__inline-status inscripcion-detalle__inline-status--success">
                {finalizeSuccess}
              </p>
            ) : null}
          </section>
        ) : null}

        {isFinalizeDialogOpen ? (
          <div
            className="inscripcion-detalle__dialog-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeFinalizeDialog()
              }
            }}
          >
            <section
              className="inscripcion-detalle__dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="finalize-dialog-title"
              aria-describedby="finalize-dialog-description"
            >
              <div className="inscripcion-detalle__dialog-heading">
                <span className="inscripcion-detalle__dialog-mark" aria-hidden="true">✓</span>
                <div>
                  <h2 id="finalize-dialog-title">Finalizar evaluación</h2>
                  <p id="finalize-dialog-description">
                    Se calcularán los puntajes finales de {nombreAspirante} y la evaluación quedará cerrada para edición.
                  </p>
                </div>
              </div>
              <p className="inscripcion-detalle__dialog-note">
                Confirma únicamente cuando todas las calificaciones y observaciones estén completas.
              </p>
              <div className="inscripcion-detalle__dialog-actions">
                <button
                  type="button"
                  className="inscripcion-detalle__dialog-button inscripcion-detalle__dialog-button--secondary"
                  disabled={finalizing}
                  onClick={closeFinalizeDialog}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="inscripcion-detalle__dialog-button inscripcion-detalle__dialog-button--primary"
                  disabled={finalizing}
                  autoFocus
                  onClick={() => void handleFinalizarInscripcion()}
                >
                  {finalizing ? 'Finalizando…' : 'Calcular y finalizar'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default InscripcionAdmisionDetallePage
