import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse, AsignaturaCatalogoDto } from './types'

type AsignaturaApiDto = {
  id: number
  codigo?: string | null
  nombre?: string | null
  codigoNombre?: string | null
}

const DEFAULT_PROGRAMA_ID = 1

const mapAsignatura = (item: AsignaturaApiDto): AsignaturaCatalogoDto => {
  const nombre = item.nombre?.trim() || item.codigoNombre?.trim() || `Asignatura #${item.id}`
  return {
    id: item.id,
    codigo: item.codigo ?? null,
    nombre,
  }
}

export async function getAsignaturasCatalogo(programaId = DEFAULT_PROGRAMA_ID): Promise<AsignaturaCatalogoDto[]> {
  const response = await httpGet<ApiResponse<AsignaturaApiDto[]>>(`/sapp/asignaturas?programaId=${programaId}`)

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar asignaturas para homologación.')
  }

  return (response.data ?? []).map(mapAsignatura)
}
