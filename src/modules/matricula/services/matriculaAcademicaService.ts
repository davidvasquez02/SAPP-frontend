import { httpGet, httpPost, httpPut } from '../../../shared/http/httpClient'
import { getDocumentosByTramiteParams } from '../../documentos/api/documentosService'
import type { DocumentoTramiteItemDto } from '../../documentos/api/types'
import { CODIGO_TIPO_TRAMITE_MATRICULA_ACADEMICA } from '../constants'
import type {
  MateriaDto,
  MatriculaAcademicaCreatePayload,
  MatriculaAcademicaListadoDto,
  MatriculaAcademicaVigenteDto,
  MatriculaValidacionAsignaturasRequest,
  MatriculaVigenteValidationResult,
} from '../types'

type ApiResponse<T> = {
  ok: boolean
  message: string
  data: T
}

type AsignaturaApiDto = {
  id: number
  nombre: string
  codigoUis: string | null
  codigoExterno: string | null
  nivel: number
  programaId: number
}

export const getAsignaturasPorPrograma = async (programaId: number): Promise<MateriaDto[]> => {
  const response = await httpGet<ApiResponse<AsignaturaApiDto[]>>(`/sapp/asignaturas?programaId=${programaId}`)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar las asignaturas del programa.')
  }

  return response.data.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    codigo: item.codigoUis ?? item.codigoExterno,
    nivel: item.nivel,
    programaId: item.programaId,
  }))
}

export const getMatriculasAcademicas = async (): Promise<MatriculaAcademicaListadoDto[]> => {
  const response = await httpGet<ApiResponse<MatriculaAcademicaListadoDto[]>>('/sapp/matriculaAcademica')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar el listado de matrículas académicas.')
  }

  return response.data
}

export const crearMatriculaAcademica = async (payload: MatriculaAcademicaCreatePayload): Promise<void> => {
  const response = await httpPost<ApiResponse<unknown>>('/sapp/matriculaAcademica', payload)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible registrar la matrícula académica.')
  }
}

export const getMatriculaVigenteByEstudiante = async (estudianteId: number): Promise<MatriculaAcademicaVigenteDto | null> => {
  const response = await httpGet<ApiResponse<MatriculaAcademicaVigenteDto[]>>(
    `/sapp/matriculaAcademica/vigente/estudiante/${estudianteId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar la matrícula vigente.')
  }

  return response.data[0] ?? null
}

export const getMatriculaVigenteValidationByEstudiante = async (
  estudianteId: number,
): Promise<MatriculaVigenteValidationResult> => {
  const response = await httpGet<ApiResponse<MatriculaAcademicaVigenteDto[] | MatriculaAcademicaVigenteDto | boolean | string>>(
    `/sapp/matriculaAcademica/vigente/estudiante/${estudianteId}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible consultar la matrícula vigente.')
  }

  if (Array.isArray(response.data)) {
    const matricula = response.data[0]
    if (!matricula) {
      throw new Error('La respuesta de matrícula vigente no contiene datos válidos.')
    }

    return {
      status: 'EXISTS',
      message: response.message || 'El estudiante ya tiene matrícula en el periodo vigente.',
      matricula,
    }
  }

  if (typeof response.data === 'object' && response.data !== null) {
    return {
      status: 'EXISTS',
      message: response.message || 'El estudiante ya tiene matrícula en el periodo vigente.',
      matricula: response.data,
    }
  }

  if (response.data === true || response.data === 'true') {
    return {
      status: 'CAN_CREATE',
      message: response.message || 'El estudiante puede crear matrícula en el periodo vigente.',
    }
  }

  if (response.data === false || response.data === 'false') {
    return {
      status: 'NO_ACTIVE_PERIOD',
      message: response.message || 'No hay un periodo de matrículas vigente.',
    }
  }

  throw new Error('Formato de respuesta no soportado al consultar matrícula vigente.')
}


export const aprobarMatriculaAcademica = async (matriculaId: number): Promise<void> => {
  const response = await httpPut<ApiResponse<unknown>>(`/sapp/matriculaAcademica/aprobar/${matriculaId}`)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible aprobar la matrícula académica.')
  }
}

export const validarAsignaturasMatriculaAcademica = async (
  matriculaId: number,
  payload: MatriculaValidacionAsignaturasRequest,
): Promise<void> => {
  const response = await httpPut<ApiResponse<unknown>>(`/sapp/matriculaAcademica/${matriculaId}/validarAsignaturas`, payload)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible validar las asignaturas de la matrícula.')
  }
}

export const getDocumentosMatriculaAcademica = async (
  matriculaId: number,
): Promise<DocumentoTramiteItemDto[]> =>
  getDocumentosByTramiteParams({
    tramiteId: matriculaId,
    codigoTipoTramite: CODIGO_TIPO_TRAMITE_MATRICULA_ACADEMICA,
  })
