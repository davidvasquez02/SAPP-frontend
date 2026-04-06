import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEvaluacionEstado } from '../api/evaluacionAdmisionEstadoService'
import type { EtapaEvaluacion } from '../types/evaluacionAdmisionTypes'

interface RequireEvaluacionEnabledProps {
  etapa: EtapaEvaluacion
  children: ReactNode
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

    getEvaluacionEstado(parsedInscripcionId)
      .then((estado) => {
        if (!isMounted) {
          return
        }

        const enabled = estado.status === 'STARTED'
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
