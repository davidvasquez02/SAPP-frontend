import { estudiantesMock } from '../mock/estudiantes.mock'
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
    codigoEstudianteUis: string | null
    cohorte: number | null
    estado: string | null
    fechaIngreso: string
  }
  nombreCompleto: string
  persona: {
    tipoDocumento: string | null
    numeroDocumento: string | null
    emailInstitucional: string | null
    emailPersonal: string | null
  }
  programaId: number
  programaCodigoNombre: string | null
}

const estudiantesCache = new Map<number, EstudianteCoordinacion>()

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

const buildCohorte = (cohorte: number | null): string => {
  if (cohorte === null) {
    return 'Sin cohorte'
  }

  return String(cohorte)
}

const resolveCorreo = (persona: EstudianteConsultaBackend['persona']) => {
  return persona.emailInstitucional?.trim() || persona.emailPersonal?.trim() || 'Sin correo registrado'
}

const toEstudianteCoordinacion = (item: EstudianteConsultaBackend): EstudianteCoordinacion => {
  const programaNombre = item.programaCodigoNombre?.trim() || `Programa ${item.programaId}`

  return {
    id: item.estudiante.id,
    codigo: item.estudiante.codigoEstudianteUis?.trim() || `EST-${item.estudiante.id}`,
    nombreCompleto: item.nombreCompleto.trim(),
    tipoDocumento: item.persona.tipoDocumento?.trim() || 'N/A',
    numeroDocumento: item.persona.numeroDocumento?.trim() || 'N/A',
    correoInstitucional: resolveCorreo(item.persona),
    estadoAcademico: normalizarEstadoAcademico(item.estudiante.estado),
    cohorte: buildCohorte(item.estudiante.cohorte),
    promedioAcumulado: 0,
    creditosAprobados: 0,
    creditosPendientes: 0,
    programaId: item.programaId,
    programaNombre,
    fechaIngreso: item.estudiante.fechaIngreso,
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

  estudiantes.forEach((estudiante) => {
    estudiantesCache.set(estudiante.id, estudiante)
  })

  return estudiantes
}

export const getEstudianteById = async (
  estudianteId: number
): Promise<EstudianteCoordinacion | null> => {
  const fromCache = estudiantesCache.get(estudianteId)
  if (fromCache) {
    return fromCache
  }

  return estudiantesMock.find((estudiante) => estudiante.id === estudianteId) ?? null
}
