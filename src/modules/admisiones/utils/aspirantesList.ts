import type { InscripcionAdmisionDto } from '../api/types'

export const ASPIRANTES_PAGE_SIZE = 8

const normalizeSearchValue = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es')

export const filterAspirantes = (
  inscripciones: InscripcionAdmisionDto[],
  query: string,
): InscripcionAdmisionDto[] => {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return inscripciones

  return inscripciones.filter((inscripcion) =>
    normalizeSearchValue(inscripcion.nombreAspirante).includes(normalizedQuery)
    || normalizeSearchValue(inscripcion.numeroInscripcion).includes(normalizedQuery)
  )
}

export const paginateAspirantes = (
  inscripciones: InscripcionAdmisionDto[],
  requestedPage: number,
  pageSize = ASPIRANTES_PAGE_SIZE,
) => {
  const pageCount = Math.max(1, Math.ceil(inscripciones.length / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const startIndex = (page - 1) * pageSize

  return {
    items: inscripciones.slice(startIndex, startIndex + pageSize),
    page,
    pageCount,
    start: inscripciones.length === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + pageSize, inscripciones.length),
  }
}
