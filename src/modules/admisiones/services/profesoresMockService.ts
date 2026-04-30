import type { ProfesorOption } from '../mock/profesores.mock'
import type { ApiResponse } from '../../../api/types'
import { httpGet } from '../../../shared/http/httpClient'

type DocenteApiDto = {
  id: number
  nombre: string | null
}

export async function fetchProfesores(): Promise<ProfesorOption[]> {
  const response = await httpGet<ApiResponse<DocenteApiDto[]>>('/sapp/docentes?query=')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar el catálogo de profesores.')
  }

  return (response.data ?? [])
    .filter((docente) => Boolean(docente.nombre?.trim()))
    .map((docente) => ({
      id: docente.id,
      nombre: docente.nombre?.trim() ?? `Docente ${docente.id}`,
    }))
}
