import type { SolicitudAcademicaDto } from '../../modules/solicitudes/api/types'

const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase('es')

export const formatFechaSolicitudDocumental = (value: string) => {
  if (!value) return '—'
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00-05:00`
    : value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long', timeZone: 'America/Bogota',
  }).format(date)
}

interface FiltrosSolicitudesDocumentales {
  busqueda: string
  estado: string
  pagina: number
  pageSize: number
}

export const seleccionarSolicitudesDocumentales = (
  solicitudes: SolicitudAcademicaDto[],
  { busqueda, estado, pagina, pageSize }: FiltrosSolicitudesDocumentales,
) => {
  const term = normalize(busqueda)
  const filtered = solicitudes.filter((solicitud) =>
    (!estado || solicitud.estado === estado) &&
    (!term || normalize(`${solicitud.tipoSolicitud} ${solicitud.id}`).includes(term)),
  ).sort((left, right) => right.fechaRegistro.localeCompare(left.fechaRegistro) || right.id - left.id)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(Math.max(1, pagina), totalPages)
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), page, totalPages }
}
