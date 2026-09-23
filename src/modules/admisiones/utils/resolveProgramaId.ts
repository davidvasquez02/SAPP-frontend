import type { InscripcionAdmisionDto } from '../api/types'
import { getProgramaAcademico } from '../../../shared/domain/programaAcademico'

export const resolveProgramaIdFromInscripciones = (
  inscripciones: InscripcionAdmisionDto[]
): number | null => {
  const programaAcademico = inscripciones[0]?.programaAcademico

  if (!programaAcademico) {
    return null
  }

  return getProgramaAcademico(programaAcademico)?.id ?? null
}
