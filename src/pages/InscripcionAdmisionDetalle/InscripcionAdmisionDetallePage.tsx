import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import InscripcionAccordionWindow from '../../modules/admisiones/components/InscripcionAccordionWindow/InscripcionAccordionWindow'
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

const DISABLED_MESSAGE = 'Disponible cuando se inicie la evaluación.'

const InscripcionAdmisionDetallePage = () => {
  const { convocatoriaId, inscripcionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [evaluacionStatus, setEvaluacionStatus] = useState<
    'LOADING' | 'NOT_STARTED' | 'STARTED' | 'ERROR'
  >('LOADING')
  const [evaluacionMsg, setEvaluacionMsg] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const nombreAspirante = (
    location.state as { nombreAspirante?: string } | null
  )?.nombreAspirante
  const pageTitle = nombreAspirante
    ? `Inscripción - ${nombreAspirante}`
    : 'Inscripción'

  const basePath =
    convocatoriaId && inscripcionId
      ? `/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`
      : ''

  const activeKey: InscripcionSectionKey | null =
    INSCRIPCION_SECTIONS.find((section) =>
      location.pathname.endsWith(`/${section.pathSuffix}`),
    )?.key ?? null

  const loadEvaluacionEstado = useCallback(async () => {
    const parsedInscripcionId = Number(inscripcionId)

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
  }, [inscripcionId])

  useEffect(() => {
    void loadEvaluacionEstado()
  }, [loadEvaluacionEstado])

  const handleIniciarEvaluacion = useCallback(async () => {
    const parsedInscripcionId = Number(inscripcionId)
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
  }, [inscripcionId, loadEvaluacionEstado])


  const sectionAvailability: Record<InscripcionSectionKey, boolean> = {
    documentos: true,
    'hoja-vida': evaluacionStatus === 'STARTED',
    examen: evaluacionStatus === 'STARTED',
    entrevistas: evaluacionStatus === 'STARTED',
  }

  const handleToggle = (sectionKey: InscripcionSectionKey) => {
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
  }

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
