import { httpGet } from '../../../shared/http/httpClient'
import type { EvaluacionAdmisionItem, EtapaEvaluacion } from '../types/evaluacionAdmisionTypes'
import type { ApiResponse } from './types'
import {
  getCachedEvaluacionAvailability,
  setCachedEvaluacionAvailability,
} from './evaluacionAdmisionAvailabilityCache'

export type EvaluacionAvailability = {
  hojaDeVida: boolean
  examen: boolean
  entrevistas: boolean
}

const EMPTY_AVAILABILITY: EvaluacionAvailability = {
  hojaDeVida: false,
  examen: false,
  entrevistas: false,
}

const fetchEtapaAvailability = async (
  inscripcionId: number,
  etapa: EtapaEvaluacion,
): Promise<boolean> => {
  const response = await httpGet<ApiResponse<EvaluacionAdmisionItem[]>>(
    `/sapp/evaluacionAdmision/info?inscripcionId=${inscripcionId}&etapa=${etapa}`,
  )

  if (!response.ok) {
    console.warn(response.message || 'Evaluación de admisión no disponible')
    return false
  }

  return Array.isArray(response.data) && response.data.length > 0
}

export const getEvaluacionAvailability = async (
  inscripcionId: number,
): Promise<EvaluacionAvailability> => {
  const cached = getCachedEvaluacionAvailability(inscripcionId)
  if (cached) {
    return cached
  }

  try {
    const [hojaDeVida, examen, entrevistas] = await Promise.all([
      fetchEtapaAvailability(inscripcionId, 'HOJA_DE_VIDA'),
      fetchEtapaAvailability(inscripcionId, 'EXAMEN_DE_CONOCIMIENTOS'),
      fetchEtapaAvailability(inscripcionId, 'ENTREVISTA'),
    ])

    const availability = { hojaDeVida, examen, entrevistas }
    setCachedEvaluacionAvailability(inscripcionId, availability)
    return availability
  } catch (error) {
    console.warn('Error consultando la evaluación de admisión', error)
    return EMPTY_AVAILABILITY
  }
}
