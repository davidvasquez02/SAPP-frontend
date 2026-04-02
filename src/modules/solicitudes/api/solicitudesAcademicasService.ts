import { httpGet, httpPost } from '../../../shared/http/httpClient'
import type { ApiResponse, CreateSolicitudRequestDto, SolicitudAcademicaDto } from './types'

const ENDPOINT_WITH_SAPP = '/sapp/solicitudesAcademicas/estudiante'
const ENDPOINT_FALLBACK = '/solicitudesAcademicas/estudiante'

const buildByEstudianteQuery = (basePath: string, estudianteId: number) =>
  `${basePath}?estudianteId=${encodeURIComponent(estudianteId)}`

export async function getSolicitudesAcademicas(): Promise<SolicitudAcademicaDto[]> {
  const response = await httpGet<ApiResponse<SolicitudAcademicaDto[]>>('/sapp/solicitudesAcademicas')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar las solicitudes.')
  }

  return response.data ?? []
}

export async function getSolicitudesAcademicasByEstudiante(estudianteId: number): Promise<SolicitudAcademicaDto[]> {
  try {
    const response = await httpGet<ApiResponse<SolicitudAcademicaDto[]>>(
      buildByEstudianteQuery(ENDPOINT_WITH_SAPP, estudianteId),
    )

    if (!response.ok) {
      throw new Error(response.message || 'No fue posible cargar las solicitudes del estudiante.')
    }

    return response.data ?? []
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('404')) {
      throw error
    }

    const fallbackResponse = await httpGet<ApiResponse<SolicitudAcademicaDto[]>>(
      buildByEstudianteQuery(ENDPOINT_FALLBACK, estudianteId),
    )

    if (!fallbackResponse.ok) {
      throw new Error(fallbackResponse.message || 'No fue posible cargar las solicitudes del estudiante.')
    }

    return fallbackResponse.data ?? []
  }
}

export async function createSolicitudAcademica(req: CreateSolicitudRequestDto): Promise<unknown> {
  const response = await httpPost<ApiResponse<unknown>>('/sapp/solicitudesAcademicas', req)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible registrar la solicitud.')
  }

  return response.data
}
