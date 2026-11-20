import { etiquetaPrograma } from '../../../shared/domain/programaAcademico'

/** Nombre completo del programa con su código: "302 - Maestría en…". */
export const getProgramaNombreLargo = (programaId: number, fallback: string): string => {
  return etiquetaPrograma({ id: programaId, nombre: fallback }) || fallback
}
