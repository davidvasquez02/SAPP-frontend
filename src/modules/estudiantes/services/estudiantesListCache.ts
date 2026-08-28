import type { ProgramType } from '../components/ProgramTypeToggle/ProgramTypeToggle'
import type { EstudianteCoordinacion, ProgramaCoordinacion } from '../types'

export interface EstudiantesListSnapshot {
  programas: ProgramaCoordinacion[]
  programTypeSeleccionado: ProgramType
  estudiantes: EstudianteCoordinacion[]
}

let detailNavigationSnapshot: EstudiantesListSnapshot | null = null

export const cacheEstudiantesListForDetail = (snapshot: EstudiantesListSnapshot) => {
  detailNavigationSnapshot = snapshot
}

export const consumeEstudiantesListFromDetail = (): EstudiantesListSnapshot | null => {
  const snapshot = detailNavigationSnapshot
  detailNavigationSnapshot = null
  return snapshot
}

export const clearEstudiantesListCache = () => {
  detailNavigationSnapshot = null
}
