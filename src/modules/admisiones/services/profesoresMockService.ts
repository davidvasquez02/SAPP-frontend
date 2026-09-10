import type { ProfesorOption } from '../mock/profesores.mock'
import type { ApiResponse } from '../../../api/types'
import { httpGet } from '../../../shared/http/httpClient'

type DocenteApiDto = {
  existeEnSapp: boolean
  id: number | null
  nombre: string | null
  uuid: string
}

export async function fetchProfesores(): Promise<ProfesorOption[]> {
  const response = await httpGet<ApiResponse<DocenteApiDto[]>>('/sapp/docentes/estado?skip=0')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar el catálogo de profesores.')
  }

  return (response.data ?? [])
    .filter((docente) => Boolean(docente.nombre?.trim()) && Boolean(docente.uuid?.trim()))
    .map((docente) => ({
      uuid: docente.uuid.trim(),
      id: docente.id,
      existeEnSapp: docente.existeEnSapp,
      nombre: docente.nombre?.trim() ?? 'Docente sin nombre',
    }))
}
