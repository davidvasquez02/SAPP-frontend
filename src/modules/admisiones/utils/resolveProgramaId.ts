import type { InscripcionAdmisionDto } from '../api/types'

const normalizeProgramaLabel = (value: string | null | undefined): string =>
  (value ?? '').toUpperCase()

export const resolveProgramaIdFromInscripciones = (
  inscripciones: InscripcionAdmisionDto[]
): number | null => {
  const programaAcademico = inscripciones[0]?.programaAcademico

  if (!programaAcademico) {
    return null
  }

  const normalized = normalizeProgramaLabel(programaAcademico)

  if (normalized.includes('DCC')) {
    return 2
  }

  if (normalized.includes('MISI')) {
    return 1
  }

  return null
}
