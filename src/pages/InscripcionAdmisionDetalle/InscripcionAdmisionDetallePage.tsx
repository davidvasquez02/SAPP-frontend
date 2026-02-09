import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import InscripcionAccordionWindow from '../../modules/admisiones/components/InscripcionAccordionWindow/InscripcionAccordionWindow'
import type { EvaluacionAvailability } from '../../modules/admisiones/api/evaluacionAdmisionAvailabilityService'
import { getEvaluacionAvailability } from '../../modules/admisiones/api/evaluacionAdmisionAvailabilityService'
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
  const [availability, setAvailability] = useState<EvaluacionAvailability | null>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(true)

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

  useEffect(() => {
    let isMounted = true
    const parsedInscripcionId = Number(inscripcionId)

    if (!inscripcionId || Number.isNaN(parsedInscripcionId)) {
      setAvailability(null)
      setLoadingAvailability(false)
      return
    }

    setLoadingAvailability(true)
    getEvaluacionAvailability(parsedInscripcionId)
      .then((response) => {
        if (!isMounted) {
          return
        }
        setAvailability(response)
      })
      .finally(() => {
        if (!isMounted) {
          return
        }
        setLoadingAvailability(false)
      })

    return () => {
      isMounted = false
    }
  }, [inscripcionId])

  const availabilityFlags = useMemo(
    () =>
      availability ?? {
        hojaDeVida: false,
        examen: false,
        entrevistas: false,
      },
    [availability],
  )

  const isLoading = loadingAvailability || availability === null

  const sectionAvailability: Record<InscripcionSectionKey, boolean> = {
    documentos: true,
    'hoja-vida': !isLoading && availabilityFlags.hojaDeVida,
    examen: !isLoading && availabilityFlags.examen,
    entrevistas: !isLoading && availabilityFlags.entrevistas,
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
                {isOpen ? outlet : null}
              </InscripcionAccordionWindow>
            )
          })}
        </div>
      </section>
    </ModuleLayout>
  )
}

export default InscripcionAdmisionDetallePage
