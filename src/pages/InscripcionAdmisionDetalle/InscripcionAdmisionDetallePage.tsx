import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import InscripcionAccordionWindow from '../../modules/admisiones/components/InscripcionAccordionWindow/InscripcionAccordionWindow'
import { cambiarEstadoInscripcionVal } from '../../modules/admisiones/api/inscripcionCambioEstadoService'
import {
  getInscripcionByConvocatoriaAndId,
} from '../../modules/admisiones/api/inscripcionAdmisionService'
import { getEvaluacionEstado } from '../../modules/admisiones/api/evaluacionAdmisionEstadoService'
import { invalidateEvaluacionAvailabilityCache } from '../../modules/admisiones/api/evaluacionAdmisionAvailabilityCache'
import { iniciarEvaluacion } from '../../modules/admisiones/api/iniciarEvaluacionService'
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

const DISABLED_MESSAGE = 'Disponible cuando se inicie la evaluación.'

const normalizeEstado = (estado?: string | null) =>
  (estado ?? '').trim().toUpperCase().replace(/\s+/g, '_')

const isEstadoEnConstruccion = (estado?: string | null) => {
  const normalized = normalizeEstado(estado)
  return normalized === 'EN_CONSTRUCCION'
}

const InscripcionAdmisionDetallePage = () => {
  const { convocatoriaId, inscripcionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [evaluacionStatus, setEvaluacionStatus] = useState<
    'LOADING' | 'NOT_STARTED' | 'STARTED' | 'ERROR'
  >('LOADING')
  const [evaluacionMsg, setEvaluacionMsg] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

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
  const [isUpdatingInscripcionEstado, setIsUpdatingInscripcionEstado] = useState(false)
  const [inscripcionEstadoWarning, setInscripcionEstadoWarning] = useState<string | null>(null)
  const didCambioEstadoValRef = useRef<Record<number, boolean>>({})
  const prevActiveRef = useRef<ActiveWindow>(null)

  const nombreAspirante = routeState?.nombreAspirante
  const pageTitle = nombreAspirante
    ? `Inscripción - ${nombreAspirante}`
    : 'Inscripción'

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
      setInscripcionEstado(inscripcion.estado ?? null)
    } catch {
      // Silenciamos el error para no interrumpir la navegación de ventanas.
    }
  }, [convocatoriaId, inscripcionId, parsedConvocatoriaId, parsedInscripcionId])

  useEffect(() => {
    setInscripcionEstado(routeState?.inscripcionEstado ?? null)
    setInscripcionEstadoWarning(null)
    setIsUpdatingInscripcionEstado(false)
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setEvaluacionStatus('ERROR')
      setEvaluacionMsg(message)
    }
  }, [inscripcionId, parsedInscripcionId])

  useEffect(() => {
    void loadEvaluacionEstado()
  }, [loadEvaluacionEstado])

  useEffect(() => {
    const previousActiveWindow = prevActiveRef.current
    prevActiveRef.current = activeWindow

    const isOpeningDocs =
      activeWindow === 'DOCUMENTOS' && previousActiveWindow !== 'DOCUMENTOS'

    if (!isOpeningDocs) {
      return
    }

    const hasValidInscripcionId = !Number.isNaN(parsedInscripcionId)
    const isEnConstruccion = isEstadoEnConstruccion(inscripcionEstado)
    const alreadyTriggered = hasValidInscripcionId
      ? Boolean(didCambioEstadoValRef.current[parsedInscripcionId])
      : false

    if (import.meta.env.DEV) {
      console.debug('[INSCRIPCION_ESTADO] open DOCUMENTOS detected', {
        inscripcionId: hasValidInscripcionId ? parsedInscripcionId : null,
        estado: inscripcionEstado,
        isEnConstruccion,
        alreadyTriggered,
      })
    }

    if (!hasValidInscripcionId) {
      return
    }

    if (!isEnConstruccion) {
      if (import.meta.env.DEV) {
        console.debug('[INSCRIPCION_ESTADO] skip cambioEstadoPorVal', {
          reason: 'not_en_construccion',
          inscripcionId: parsedInscripcionId,
        })
      }
      return
    }

    if (alreadyTriggered) {
      if (import.meta.env.DEV) {
        console.debug('[INSCRIPCION_ESTADO] skip cambioEstadoPorVal', {
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
          console.debug('[INSCRIPCION_ESTADO] calling PUT cambioEstadoPorVal', {
            inscripcionId: parsedInscripcionId,
          })
        }
        await cambiarEstadoInscripcionVal(parsedInscripcionId)
        didCambioEstadoValRef.current[parsedInscripcionId] = true
        if (import.meta.env.DEV) {
          console.debug('[INSCRIPCION_ESTADO] cambioEstadoPorVal OK', {
            inscripcionId: parsedInscripcionId,
          })
        }
        await reloadInscripcionDetalle()
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[INSCRIPCION_ESTADO] cambioEstadoPorVal ERROR', {
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
      await loadEvaluacionEstado()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setEvaluacionStatus('ERROR')
      setEvaluacionMsg(message)
    } finally {
      setStarting(false)
    }
  }, [inscripcionId, loadEvaluacionEstado, parsedInscripcionId])

  const sectionAvailability: Record<InscripcionSectionKey, boolean> = {
    documentos: true,
    'hoja-vida': evaluacionStatus === 'STARTED',
    examen: evaluacionStatus === 'STARTED',
    entrevistas: evaluacionStatus === 'STARTED',
  }

  const handleToggle = useCallback(
    (sectionKey: InscripcionSectionKey) => {
      if (!basePath) {
        return
      }

      if (!sectionAvailability[sectionKey]) {
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
    [activeKey, basePath, navigate, sectionAvailability],
  )

  const outlet = <Outlet />

  return (
    <ModuleLayout title="Admisiones">
      <section className="inscripcion-detalle">
        <Link
          className="inscripcion-detalle__back"
          to={`/admisiones/convocatoria/${convocatoriaId}`}
        >
          ← Volver a Convocatoria
        </Link>

        <h1 className="inscripcion-detalle__title">{pageTitle}</h1>
        <p className="inscripcion-detalle__subtitle">Seleccione una opción</p>
        {evaluacionStatus === 'ERROR' && evaluacionMsg ? (
          <p className="inscripcion-detalle__alert inscripcion-detalle__alert--error">
            {evaluacionMsg}
          </p>
        ) : null}
        {evaluacionStatus === 'NOT_STARTED' && evaluacionMsg ? (
          <p className="inscripcion-detalle__alert">{evaluacionMsg}</p>
        ) : null}

        <div className="inscripcion-detalle__windows">
          {INSCRIPCION_SECTIONS.map((section) => {
            const isOpen = activeKey === section.key
            const isEnabled = sectionAvailability[section.key]
            const subtitle = isEnabled ? undefined : DISABLED_MESSAGE

            return (
              <InscripcionAccordionWindow
                key={section.key}
                title={section.title}
                subtitle={subtitle}
                isOpen={isOpen}
                isDisabled={!isEnabled}
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

                    {outlet}
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
      </section>
    </ModuleLayout>
  )
}

export default InscripcionAdmisionDetallePage
