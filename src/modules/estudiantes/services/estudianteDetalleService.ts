import { httpGet } from '../../../shared/http/httpClient'
import { getDocumentosByTramiteParams } from '../../documentos/api/documentosService'
import type { DocumentoTramiteItemDto } from '../../documentos/api/types'
import {
  getDocumentosMatriculaAcademica,
  getMatriculasAcademicas,
} from '../../matricula/services/matriculaAcademicaService'
import { getSolicitudesAcademicasByEstudiante } from '../../solicitudes/api/solicitudesAcademicasService'
import type { SolicitudAcademicaDto } from '../../solicitudes/api/types'
import type { MatriculaAcademicaListadoDto } from '../../matricula/types'
import type { AdmisionResumen, MatriculaResumen, SolicitudResumen } from '../types'

type ApiResponse<T> = {
  ok: boolean
  message: string
  data: T
}

type AdmisionBackendDto = {
  id: number
  convocatoriaId: number | null
  estado: string
  fechaInscripcion: string | null
  fechaResultado: string | null
  puntajeTotal: number | null
}

const ADMISION_BY_ESTUDIANTE_ENDPOINT = '/sapp/inscripcionAdmision/estudiante'

const mapMatriculaResumen = async (
  matricula: MatriculaAcademicaListadoDto,
): Promise<MatriculaResumen> => {
  const documentos = await getDocumentosMatriculaAcademica(matricula.id)

  return {
    id: matricula.id,
    periodoAcademico: matricula.periodoAcademico,
    estado: matricula.estado,
    fechaSolicitud: matricula.fechaSolicitud,
    documentos,
  }
}

const mapSolicitudResumen = async (
  solicitud: SolicitudAcademicaDto,
): Promise<SolicitudResumen> => {
  const codigoTipoTramite = solicitud.tipoTramiteCodigo?.trim()

  const documentos = codigoTipoTramite
    ? await getDocumentosByTramiteParams({
        tramiteId: solicitud.id,
        codigoTipoTramite,
      })
    : []

  return {
    id: solicitud.id,
    tipoSolicitud: solicitud.tipoSolicitud,
    estado: solicitud.estado,
    fechaRegistro: solicitud.fechaRegistro,
    documentos,
  }
}

const mapAdmisionResumen = async (admision: AdmisionBackendDto): Promise<AdmisionResumen> => {
  const documentos = await getDocumentosByTramiteParams({
    tramiteId: admision.id,
    codigoTipoTramite: 1002,
  })

  return {
    id: admision.id,
    estado: admision.estado,
    fechaInscripcion: admision.fechaInscripcion,
    fechaResultado: admision.fechaResultado,
    puntajeTotal: admision.puntajeTotal,
    documentos,
  }
}

export const getMatriculasByEstudiante = async (estudianteId: number): Promise<MatriculaResumen[]> => {
  const matriculas = await getMatriculasAcademicas()
  const matriculasEstudiante = matriculas.filter((item) => item.estudianteId === estudianteId)

  return Promise.all(matriculasEstudiante.map((item) => mapMatriculaResumen(item)))
}

export const getSolicitudesByEstudiante = async (estudianteId: number): Promise<SolicitudResumen[]> => {
  const solicitudes = await getSolicitudesAcademicasByEstudiante(estudianteId)
  return Promise.all(solicitudes.map((item) => mapSolicitudResumen(item)))
}

export const getAdmisionesByEstudiante = async (estudianteId: number): Promise<AdmisionResumen[]> => {
  const response = await httpGet<ApiResponse<AdmisionBackendDto[]>>(
    `${ADMISION_BY_ESTUDIANTE_ENDPOINT}?estudianteId=${encodeURIComponent(estudianteId)}`,
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar las admisiones del estudiante.')
  }

  return Promise.all((response.data ?? []).map((item) => mapAdmisionResumen(item)))
}

export type { DocumentoTramiteItemDto }
