import type { SolicitudTableRow, TipoSolicitudDto } from '../solicitudes/types'

export type NivelTrabajoGrado = 'maestria' | 'doctorado'

export const CODIGOS_PROCESO_EVALUACION_TG = new Set([
  'DEF_TESIS_DCC',
  'DEF_TI_MISI',
  'CAND_DOCTORAL',
  'PROP_TESIS_DCC',
  'PROP_TI_MISI',
])

export const tieneProcesoEvaluacionTg = (codigo: string | null | undefined): boolean =>
  CODIGOS_PROCESO_EVALUACION_TG.has(codigo?.trim().toLocaleUpperCase('es-CO') ?? '')

export const TIPO_TEMA_TRABAJO_GRADO_ID = 13

export const TIPOS_TRABAJO_GRADO_POR_NIVEL: Record<NivelTrabajoGrado, readonly number[]> = {
  maestria: [TIPO_TEMA_TRABAJO_GRADO_ID, 6, 7],
  doctorado: [TIPO_TEMA_TRABAJO_GRADO_ID, 8, 4, 5],
}

export const TIPOS_TRABAJO_GRADO_IDS = new Set(
  Object.values(TIPOS_TRABAJO_GRADO_POR_NIVEL).flat(),
)

export const isTipoTrabajoGrado = (tipoSolicitudId: number | undefined): boolean =>
  tipoSolicitudId !== undefined && TIPOS_TRABAJO_GRADO_IDS.has(tipoSolicitudId)

const normalizeEstadoResolucion = (value: string | null | undefined): string =>
  value
    ?.trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('es-CO') ?? ''

export const getAprobacionTrabajoGradoLabel = (
  tipoSolicitudId: number | undefined,
  estadoSigla: string | null | undefined,
  estadoNombre: string | null | undefined,
): string => {
  if (!isTipoTrabajoGrado(tipoSolicitudId)) {
    return 'Aprobar'
  }

  const estado = `${normalizeEstadoResolucion(estadoSigla)} ${normalizeEstadoResolucion(estadoNombre)}`

  if (estado.includes('CONSEJO')) {
    return 'Aprobar y asignar jurados'
  }

  if (estado.includes('ENVIADA') || estado.includes('COMITE')) {
    return 'Aprobar y enviar a consejo académico'
  }

  return 'Aprobar'
}

export const getNivelTrabajoGrado = (programa: string | null | undefined): NivelTrabajoGrado =>
  programa?.toLocaleUpperCase('es-CO').includes('DCC') ? 'doctorado' : 'maestria'

export const correspondeSolicitudANivel = (
  solicitud: Pick<SolicitudTableRow, 'tipoSolicitudId' | 'programaAcademico'>,
  nivel: NivelTrabajoGrado,
): boolean =>
  solicitud.tipoSolicitudId !== TIPO_TEMA_TRABAJO_GRADO_ID ||
  getNivelTrabajoGrado(solicitud.programaAcademico) === nivel

export const contextualizarTipoTrabajoGrado = (
  tipo: TipoSolicitudDto,
  nivel: NivelTrabajoGrado,
): TipoSolicitudDto => {
  if (tipo.id !== TIPO_TEMA_TRABAJO_GRADO_ID) {
    return tipo
  }

  return {
    ...tipo,
    nombre:
      nivel === 'doctorado'
        ? 'Inscripción de tema de tesis doctoral'
        : 'Inscripción de tema de trabajo de investigación',
  }
}
