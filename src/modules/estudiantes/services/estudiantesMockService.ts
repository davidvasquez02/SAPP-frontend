import { estudiantesMock } from '../mock/estudiantes.mock'
import type { ApiResponse } from '../../../api/types'
import { httpGet } from '../../../shared/http/httpClient'
import type { EstudianteCoordinacion, ProgramaCoordinacion } from '../types'

const MOCK_DELAY_MS = 200
const PROGRAMAS_ENDPOINT = '/sapp/programaAcademico'

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

const delay = async () => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS)
  })
}

type ProgramaAcademicoBackend = {
  id: number
  nombre: string
  codigoNombre: string
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
  await delay()
  return estudiantesMock.filter((estudiante) => estudiante.programaId === programaId)
}

export const getEstudianteById = async (
  estudianteId: number
): Promise<EstudianteCoordinacion | null> => {
  await delay()
  return estudiantesMock.find((estudiante) => estudiante.id === estudianteId) ?? null
}
