import { httpGet, httpPost } from '../../../shared/http/httpClient'
import type { ApiResponse, CreateSolicitudRequestDto, SolicitudAcademicaDto } from './types'

const ENDPOINT_BY_ESTUDIANTE = '/sapp/solicitudesAcademicas/estudiante'

export async function getSolicitudesAcademicas(): Promise<SolicitudAcademicaDto[]> {
  const response = await httpGet<ApiResponse<SolicitudAcademicaDto[]>>('/sapp/solicitudesAcademicas')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar las solicitudes.')
  }

  return response.data ?? []
}

export async function getSolicitudesAcademicasByEstudiante(estudianteId: number): Promise<SolicitudAcademicaDto[]> {
  const response = await httpGet<ApiResponse<SolicitudAcademicaDto[]>>(
    `${ENDPOINT_BY_ESTUDIANTE}?estudianteId=${encodeURIComponent(estudianteId)}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar las solicitudes del estudiante.')
  }

  return response.data ?? []
}

export async function getSolicitudAcademicaById(solicitudId: number): Promise<SolicitudAcademicaDto> {
  const response = await httpGet<ApiResponse<SolicitudAcademicaDto>>(`/sapp/solicitudesAcademicas/${solicitudId}`)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar la solicitud.')
  }

  if (!response.data) {
    throw new Error('Solicitud no encontrada')
  }

  return response.data
}

export async function createSolicitudAcademica(req: CreateSolicitudRequestDto): Promise<unknown> {
  const response = await httpPost<ApiResponse<unknown>>('/sapp/solicitudesAcademicas', req)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible registrar la solicitud.')
  }

  return response.data
}
