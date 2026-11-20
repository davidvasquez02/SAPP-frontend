import { httpDelete, httpFile, httpGet, httpPost, httpPut } from '../../../shared/http/httpClient'
import type { HttpFileResponse } from '../../../shared/http/httpClient'
import type {
  ConvocatoriaAdmisionCloseResponse,
  ConvocatoriaAdmisionCreateResponse,
  ConvocatoriaAdmisionDatesUpdateResponse,
  ConvocatoriaAdmisionDto,
  ConvocatoriaAdmisionListResponse,
  CreateConvocatoriaRequest,
  DocenteEvaluadorOption,
  EvaluadoresConvocatoriaResponse,
  EvaluadorConvocatoriaDto,
  UpdateConvocatoriaFechasRequest,
  UpdateConvocatoriaRequest,
} from './convocatoriaAdmisionTypes'

export const getConvocatoriasAdmision = async (): Promise<ConvocatoriaAdmisionDto[]> => {
  const response = await httpGet<ConvocatoriaAdmisionListResponse>('/sapp/convocatoriaAdmision')

  if (!response.ok) {
    throw new Error(response.message || 'Error al obtener las convocatorias')
  }

  return response.data ?? []
}

export const updateConvocatoriaAdmisionFechas = async (
  convocatoriaId: number,
  request: UpdateConvocatoriaFechasRequest
): Promise<void | ConvocatoriaAdmisionDto> => {
  const response = await httpPut<ConvocatoriaAdmisionDatesUpdateResponse>(
    `/sapp/convocatoriaAdmision/fechas/${convocatoriaId}`,
    request
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al actualizar las fechas de la convocatoria')
  }

  return response.data ?? undefined
}

/** Edita fechas, cupos y observaciones; el servidor lo rechaza si la evaluación de algún aspirante ya se inició. */
export const updateConvocatoriaAdmision = async (
  convocatoriaId: number,
  request: UpdateConvocatoriaRequest
): Promise<void | ConvocatoriaAdmisionDto> => {
  const response = await httpPut<ConvocatoriaAdmisionDatesUpdateResponse>(
    `/sapp/convocatoriaAdmision/${convocatoriaId}`,
    request
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al actualizar la convocatoria')
  }

  return response.data ?? undefined
}

export const createConvocatoriaAdmision = async (
  request: CreateConvocatoriaRequest
): Promise<void | ConvocatoriaAdmisionDto> => {
  const response = await httpPost<ConvocatoriaAdmisionCreateResponse>(
    '/sapp/convocatoriaAdmision',
    request
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al crear la convocatoria')
  }

  return response.data ?? undefined
}

export const cerrarConvocatoriaAdmision = async (convocatoriaId: number): Promise<void> => {
  const response = await httpPut<ConvocatoriaAdmisionCloseResponse>(
    `/sapp/convocatoriaAdmision/cerrar/${convocatoriaId}`
  )

  if (!response.ok) {
    throw new Error(response.message || 'Error al cerrar la convocatoria')
  }
}

export const getEvaluadoresConvocatoria = async (
  convocatoriaId: number,
): Promise<EvaluadorConvocatoriaDto[]> => {
  const response = await httpGet<EvaluadoresConvocatoriaResponse>(
    `/sapp/evaluadorConvocatoria/convocatoria/${convocatoriaId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar los evaluadores de la convocatoria')
  }

  return response.data ?? []
}

type DocenteApiDto = { uuid: string; fullName: string; tieneRolDocentePosgrados: boolean }

/** Docentes habilitados (rol DOCENTE_POSGRADOS) que se pueden asignar como evaluadores de una convocatoria. */
export const getDocentesEvaluadores = async (): Promise<DocenteEvaluadorOption[]> => {
  const response = await httpGet<{ ok: boolean; message?: string; data?: DocenteApiDto[] | null }>(
    '/sapp/docentes?skip=0&limit=200',
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los docentes')
  }

  return (response.data ?? [])
    .filter((docente) => docente.tieneRolDocentePosgrados && docente.uuid?.trim() && docente.fullName?.trim())
    .map((docente) => ({ uuid: docente.uuid.trim(), nombre: docente.fullName.trim() }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

/** Agrega un docente como evaluador (miembro del comité); el servidor lo rechaza si la evaluación ya se inició. */
export const addEvaluadorConvocatoria = async (convocatoriaId: number, evaluadorUuid: string): Promise<void> => {
  const response = await httpPost<{ ok: boolean; message?: string }>('/sapp/evaluadorConvocatoria', {
    convocatoriaId,
    evaluadorUuid,
  })

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible agregar el evaluador')
  }
}

/** Quita un evaluador de la convocatoria; los miembros fijos y las convocatorias con evaluación iniciada lo rechazan. */
export const removeEvaluadorConvocatoria = async (asignacionId: number): Promise<void> => {
  const response = await httpDelete<{ ok: boolean; message?: string }>(
    `/sapp/evaluadorConvocatoria/${asignacionId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible quitar el evaluador')
  }
}

/**
 * Zip con los documentos de todos los aspirantes de una convocatoria finalizada: carpetas Admitidos y No admitidos, y dentro
 * de cada aspirante las carpetas de su expediente. El backend rechaza la descarga si la convocatoria sigue abierta.
 */
export const downloadDocumentosAspirantesConvocatoria = async (
  convocatoriaId: number,
): Promise<HttpFileResponse> =>
  httpFile(`/sapp/convocatoriaAdmision/${encodeURIComponent(convocatoriaId)}/documentos-zip`, { method: 'GET' })
