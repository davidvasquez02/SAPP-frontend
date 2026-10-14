import type { ProgramType } from '../components/ProgramTypeToggle/ProgramTypeToggle'

const STORAGE_KEY = 'sapp.estudiantes.programType'

export const leerProgramaEstudiantes = (): ProgramType => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'maestria' ? 'maestria' : 'doctorado'
  } catch {
    return 'doctorado'
  }
}

export const guardarProgramaEstudiantes = (programa: ProgramType): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, programa)
  } catch {
    // La navegación sigue funcionando si el navegador bloquea el almacenamiento.
  }
}
