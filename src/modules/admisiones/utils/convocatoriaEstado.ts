import type { ConvocatoriaAdmisionDto } from '../api/convocatoriaAdmisionTypes'

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

const parseConvocatoriaDate = (rawValue: string | null | undefined, isEnd: boolean): Date | null => {
  if (!rawValue) {
    return null
  }

  const trimmed = rawValue.trim()
  if (!trimmed) {
    return null
  }

  if (dateOnlyPattern.test(trimmed)) {
    return new Date(`${trimmed}T${isEnd ? '23:59:59' : '00:00:00'}`)
  }

  const normalized = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed
  const parsedDate = new Date(normalized)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

export const isConvocatoriaVigente = (
  convocatoria: Pick<ConvocatoriaAdmisionDto, 'fechaInicio' | 'fechaFin' | 'vigente'>,
  now: Date = new Date()
): boolean => {
  const startDate = parseConvocatoriaDate(convocatoria.fechaInicio, false)
  const endDate = parseConvocatoriaDate(convocatoria.fechaFin, true)

  if (!startDate || !endDate) {
    return convocatoria.vigente
  }

  return now >= startDate && now <= endDate
}
