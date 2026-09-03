import { httpGet, httpPost } from '../../../shared/http/httpClient'
import type {
  ApiResponse,
  CreateSolicitudRequestDto,
  CreateSolicitudResponseDto,
  PreviewSolicitudCreditoRequestDto,
  PreviewSolicitudCreditoResponseDto,
  SolicitudAcademicaDto,
} from './types'

const ENDPOINT_BY_ESTUDIANTE = '/sapp/solicitudesAcademicas/estudiante'
const ENDPOINT_SOLICITUDES = '/sapp/solicitudesAcademicas'
const ENDPOINT_SOLICITUDES_ASIGNADAS = `${ENDPOINT_SOLICITUDES}/asignadas`

export type SolicitudesFilter = {
  estadoId?: number
  tipoSolicitudId?: number
}

export async function getSolicitudesAcademicas(): Promise<SolicitudAcademicaDto[]> {
  return getSolicitudesAcademicasFiltered({})
}

export async function getSolicitudesAcademicasAsignadas(idUsuario: number): Promise<SolicitudAcademicaDto[]> {
  const response = await httpGet<ApiResponse<SolicitudAcademicaDto[]>>(
    `${ENDPOINT_SOLICITUDES_ASIGNADAS}?idUsuario=${encodeURIComponent(idUsuario)}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar las solicitudes asignadas.')
  }

  return response.data ?? []
}

export async function getSolicitudesAcademicasFiltered(filters: SolicitudesFilter): Promise<SolicitudAcademicaDto[]> {
  const params = new URLSearchParams()

  if (filters.estadoId !== undefined) {
    params.append('estadoId', String(filters.estadoId))
  }

  if (filters.tipoSolicitudId !== undefined) {
    params.append('tipoSolicitudId', String(filters.tipoSolicitudId))
  }

  const queryString = params.toString()
  const endpoint = queryString ? `${ENDPOINT_SOLICITUDES}?${queryString}` : ENDPOINT_SOLICITUDES
  const response = await httpGet<ApiResponse<SolicitudAcademicaDto[]>>(endpoint)

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

export async function firmarDocumentosSolicitudAcademica(solicitudId: number): Promise<void> {
  const response = await httpPost<ApiResponse<unknown>>(
    `/sapp/firmasDocumento/solicitudesAcademicas/${solicitudId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible firmar los documentos de la solicitud.')
  }
}

export async function createSolicitudAcademica(req: CreateSolicitudRequestDto): Promise<CreateSolicitudResponseDto | null> {
  const response = await httpPost<ApiResponse<CreateSolicitudResponseDto>>('/sapp/solicitudesAcademicas', req)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible registrar la solicitud.')
  }

  return response.data ?? null
}

export async function previsualizarSolicitudCredito(
  req: PreviewSolicitudCreditoRequestDto,
): Promise<PreviewSolicitudCreditoResponseDto[]> {
  const response = await httpPost<ApiResponse<PreviewSolicitudCreditoResponseDto[] | PreviewSolicitudCreditoResponseDto>>(
    '/sapp/solicitudesAcademicas/pdf-previsualizacion',
    req,
  )
  const documents = Array.isArray(response.data) ? response.data : response.data ? [response.data] : []
  const hasInvalidDocument = documents.some(
    (document) => !document.base64DocumentoContenido || !document.mimeTypeDocumentoContenido,
  )
  if (!response.ok || documents.length === 0 || hasInvalidDocument) {
    throw new Error(response.message || 'No fue posible generar la previsualización del documento.')
  }
  return documents
}
