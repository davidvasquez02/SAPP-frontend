import { HttpError, httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse, InscripcionAdmisionDto } from './types'

export const getInscripcionesByConvocatoria = async (
  convocatoriaId: number,
): Promise<InscripcionAdmisionDto[]> => {
  let response: ApiResponse<InscripcionAdmisionDto[]>

  try {
    response = await httpGet<ApiResponse<InscripcionAdmisionDto[]>>(
      `/sapp/inscripcionAdmision/convocatoria/${convocatoriaId}`,
    )
  } catch (error) {
    // Este endpoint usa 404 para representar una colección todavía vacía.
    // La convocatoria se valida por separado en la pantalla de detalle.
    if (error instanceof HttpError && error.status === 404) {
      return []
    }

    throw error
  }

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener las inscripciones')
  }

  return response.data
}

export const getInscripcionByConvocatoriaAndId = async (
  convocatoriaId: number,
  inscripcionId: number,
): Promise<InscripcionAdmisionDto> => {
  const inscripciones = await getInscripcionesByConvocatoria(convocatoriaId)
  const inscripcion = inscripciones.find((item) => item.id === inscripcionId)

  if (!inscripcion) {
    throw new Error('No fue posible encontrar la inscripción indicada.')
  }

  return inscripcion
}

export const getInscripcionByAspirante = async (
  aspiranteId: number,
): Promise<InscripcionAdmisionDto | null> => {
  const response = await httpGet<ApiResponse<InscripcionAdmisionDto | null>>(
    `/sapp/inscripcionAdmision/aspirante/${encodeURIComponent(aspiranteId)}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener la inscripción del aspirante')
  }

  return response.data
}

/**
 * Igual que getInscripcionByAspirante, pero para varios aspirantes en una sola llamada: evita que
 * un listado (ej. el módulo de estudiantes) haga una petición por aspirante y agote el rate limit
 * del gateway (429). Los aspirantes sin inscripción simplemente no aparecen en el mapa resultante.
 */
export const getInscripcionesByAspirantes = async (
  aspiranteIds: number[],
): Promise<Map<number, InscripcionAdmisionDto>> => {
  const uniqueIds = [...new Set(aspiranteIds)].filter((id) => Number.isFinite(id) && id > 0)

  if (uniqueIds.length === 0) {
    return new Map()
  }

  const response = await httpGet<ApiResponse<InscripcionAdmisionDto[]>>(
    `/sapp/inscripcionAdmision/by-aspirantes?aspiranteIds=${uniqueIds.join(',')}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener las inscripciones de los aspirantes')
  }

  return new Map((response.data ?? []).map((inscripcion) => [inscripcion.aspiranteId, inscripcion]))
}
