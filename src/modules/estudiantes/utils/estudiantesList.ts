import type { EstudianteCoordinacion } from '../types'

export const ESTUDIANTES_PAGE_SIZE = 4

export const getEstudiantesPageSize = (viewportWidth: number) => {
  if (viewportWidth >= 1280) return 4
  if (viewportWidth >= 900) return 3
  if (viewportWidth >= 640) return 2
  return 1
}

export const paginateEstudiantes = (
  estudiantes: EstudianteCoordinacion[],
  requestedPage: number,
  pageSize = ESTUDIANTES_PAGE_SIZE,
) => {
  const pageCount = Math.max(1, Math.ceil(estudiantes.length / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const startIndex = (page - 1) * pageSize

  return {
    items: estudiantes.slice(startIndex, startIndex + pageSize),
    page,
    pageCount,
    start: estudiantes.length === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + pageSize, estudiantes.length),
    total: estudiantes.length,
  }
}
