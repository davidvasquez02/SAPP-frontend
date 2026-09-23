import { getProgramaAcademico } from '../../../shared/domain/programaAcademico'

export const getProgramaNombreLargo = (programaId: number, fallback: string): string => {
  return getProgramaAcademico({ id: programaId, nombre: fallback })?.nombre ?? fallback
}
