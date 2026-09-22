import type { TipoSolicitudDto } from '../solicitudes/types'

export type NivelTrabajoGrado = 'maestria' | 'doctorado'

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

export const getNivelTrabajoGrado = (programa: string | null | undefined): NivelTrabajoGrado =>
  programa?.toLocaleLowerCase('es-CO').includes('doctor') ? 'doctorado' : 'maestria'

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
