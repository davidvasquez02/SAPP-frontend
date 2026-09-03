import type { ApiResponse } from '../../../api/types'
import { httpGet } from '../../../shared/http/httpClient'
import type { EstudianteCoordinacion, ProgramaCoordinacion } from '../types'

const PROGRAMAS_ENDPOINT = '/sapp/programaAcademico'
const ESTUDIANTES_CONSULTA_ENDPOINT = '/sapp/estudiantes/consulta'

const PROGRAMAS_COORDINACION: Record<
  string,
  { codigo: string; nombre: ProgramaCoordinacion['nombre'] }
> = {
  MISI: {
    codigo: 'MISI',
    nombre: 'Maestría en Ingeniería de Sistemas e Informática',
  },
  DCC: {
    codigo: 'DCC',
    nombre: 'Doctorado en Ciencias de la Computación',
  },
}

type ProgramaAcademicoBackend = {
  id: number
  nombre: string
  codigoNombre: string
}

type EstudianteConsultaBackend = {
  estudiante: {
    id: number
    idAspirante: number | null
    codigoEstudianteUis: string | null
    cohorte: string | number | null
    estado: string | null
    fechaIngreso: string | null
    fechaEgreso: string | null
    foto?: {
      contenidoBase64: string | null
      mimeType: string | null
    } | null
  }
  nombreCompleto: string
  numeroDocumento: string | null
  correoInstitucional: string | null
  correoPersonal: string | null
  persona: {
    id: number
    idpId: string | null
    tipoDocumento?: string | null
    numeroDocumento?: string | null
    emailInstitucional?: string | null
    emailPersonal?: string | null
  }
  programaId: number
  programaCodigoNombre: string | null
}

const toProgramaCoordinacion = (programa: ProgramaAcademicoBackend): ProgramaCoordinacion | null => {
  const nombreCorto = programa.nombre.trim().toUpperCase()
  const definicion = PROGRAMAS_COORDINACION[nombreCorto]

  if (!definicion) {
    return null
  }

  const codigoDesdeCatalogo = programa.codigoNombre.split('-')[1]?.trim().toUpperCase()
  const codigo = codigoDesdeCatalogo || definicion.codigo

  return {
    id: programa.id,
    codigo,
    nombre: definicion.nombre,
  }
}

const normalizarEstadoAcademico = (estado: string | null): EstudianteCoordinacion['estadoAcademico'] => {
  if (!estado) {
    return 'ACTIVO'
  }

  const normalized = estado.trim().toUpperCase()

  if (normalized === 'EN_TRABAJO_DE_GRADO' || normalized === 'EN_ESPERA_CANDIDATURA' || normalized === 'ACTIVO') {
    return normalized
  }

  if (normalized === '1') {
    return 'ACTIVO'
  }

  return normalized
}

const buildCohorte = (cohorte: string | number | null): string => {
  if (cohorte === null) {
    return 'Sin cohorte'
  }

  return String(cohorte)
}

const resolveCorreoInstitucional = (item: EstudianteConsultaBackend) => {
  return item.correoInstitucional?.trim()
    || item.persona.emailInstitucional?.trim()
    || 'Sin correo institucional registrado'
}

const resolveCorreoPersonal = (item: EstudianteConsultaBackend) => {
  return item.correoPersonal?.trim()
    || item.persona.emailPersonal?.trim()
    || 'Sin correo personal registrado'
}

const toEstudianteCoordinacion = (item: EstudianteConsultaBackend): EstudianteCoordinacion => {
  const programaNombre = item.programaCodigoNombre?.trim() || `Programa ${item.programaId}`

  return {
    id: item.estudiante.id,
    idAspirante: item.estudiante.idAspirante,
    codigo: item.estudiante.codigoEstudianteUis?.trim() || `EST-${item.estudiante.id}`,
    codigoEstudianteUis: item.estudiante.codigoEstudianteUis?.trim() || null,
    nombreCompleto: item.nombreCompleto.trim(),
    fotoUrl: null,
    foto: item.estudiante.foto ?? null,
    tipoDocumento: item.persona.tipoDocumento?.trim() || 'N/A',
    numeroDocumento: item.numeroDocumento?.trim() || item.persona.numeroDocumento?.trim() || 'N/A',
    correoInstitucional: resolveCorreoInstitucional(item),
    correoPersonal: resolveCorreoPersonal(item),
    personaId: item.persona.id ?? null,
    personaIdpId: item.persona.idpId?.trim() || null,
    estadoAcademico: normalizarEstadoAcademico(item.estudiante.estado),
    cohorte: buildCohorte(item.estudiante.cohorte),
    promedioAcumulado: 0,
    creditosAprobados: 0,
    creditosPendientes: 0,
    programaId: item.programaId,
    programaNombre,
    fechaIngreso: item.estudiante.fechaIngreso,
    fechaEgreso: item.estudiante.fechaEgreso,
  }
}

export const getProgramasCoordinacion = async (): Promise<ProgramaCoordinacion[]> => {
  const response = await httpGet<ApiResponse<ProgramaAcademicoBackend[]>>(PROGRAMAS_ENDPOINT)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los programas académicos.')
  }

  const programasFiltrados = (response.data ?? [])
    .map((programa) => toProgramaCoordinacion(programa))
    .filter((programa): programa is ProgramaCoordinacion => Boolean(programa))

  if (programasFiltrados.length === 0) {
    throw new Error('No se encontraron programas válidos para coordinación.')
  }

  return programasFiltrados
}

export const getEstudiantesByPrograma = async (
  programaId: number
): Promise<EstudianteCoordinacion[]> => {
  const response = await httpGet<ApiResponse<EstudianteConsultaBackend[]>>(
    `${ESTUDIANTES_CONSULTA_ENDPOINT}?programaId=${programaId}&egresados=false`
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los estudiantes del programa.')
  }

  const estudiantes = (response.data ?? []).map((item) => toEstudianteCoordinacion(item))

  return estudiantes
}

export const getEstudianteById = async (
  estudianteId: number
): Promise<EstudianteCoordinacion | null> => {
  const response = await httpGet<ApiResponse<EstudianteConsultaBackend[]>>(
    `${ESTUDIANTES_CONSULTA_ENDPOINT}?estudianteId=${estudianteId}`
  )

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar el detalle del estudiante.')
  }

  const estudiante = (response.data ?? []).find((item) => item.estudiante.id === estudianteId)
  return estudiante ? toEstudianteCoordinacion(estudiante) : null
}
