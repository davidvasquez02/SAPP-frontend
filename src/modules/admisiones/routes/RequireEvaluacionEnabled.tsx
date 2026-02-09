import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getEvaluacionAvailability,
  type EvaluacionAvailability,
} from '../api/evaluacionAdmisionAvailabilityService'
import type { EtapaEvaluacion } from '../types/evaluacionAdmisionTypes'

interface RequireEvaluacionEnabledProps {
  etapa: EtapaEvaluacion
  children: ReactNode
}

const resolveEtapaAvailability = (
  availability: EvaluacionAvailability,
  etapa: EtapaEvaluacion,
) => {
  switch (etapa) {
    case 'HOJA_DE_VIDA':
      return availability.hojaDeVida
    case 'EXAMEN_DE_CONOCIMIENTOS':
      return availability.examen
    case 'ENTREVISTA':
      return availability.entrevistas
    default:
      return false
  }
}

const RequireEvaluacionEnabled = ({ etapa, children }: RequireEvaluacionEnabledProps) => {
  const { convocatoriaId, inscripcionId } = useParams()
  const navigate = useNavigate()
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true
    const parsedInscripcionId = Number(inscripcionId)

    const fallbackPath = convocatoriaId && inscripcionId
      ? `/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`
      : '/admisiones'

    if (!inscripcionId || Number.isNaN(parsedInscripcionId)) {
      navigate(fallbackPath, { replace: true })
      setIsAllowed(false)
      return () => {
        isMounted = false
      }
    }

    getEvaluacionAvailability(parsedInscripcionId)
      .then((availability) => {
        if (!isMounted) {
          return
        }

        const enabled = resolveEtapaAvailability(availability, etapa)
        if (!enabled) {
          navigate(fallbackPath, { replace: true })
        }
        setIsAllowed(enabled)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        navigate(fallbackPath, { replace: true })
        setIsAllowed(false)
      })

    return () => {
      isMounted = false
    }
  }, [convocatoriaId, etapa, inscripcionId, navigate])

  if (isAllowed === null) {
    return <div>Cargando...</div>
  }

  if (!isAllowed) {
    return null
  }

  return <>{children}</>
}

export default RequireEvaluacionEnabled
