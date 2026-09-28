import type { ProfesorOption } from '../mock/profesores.mock'
import type { ApiResponse } from '../../../api/types'
import { httpGet } from '../../../shared/http/httpClient'

type DocenteApiDto = {
  documentNumber: string
  email: string
  fullName: string
  tieneRolDocentePosgrados: boolean
  uuid: string
}

export async function fetchProfesores(): Promise<ProfesorOption[]> {
  const response = await httpGet<ApiResponse<DocenteApiDto[]>>('/sapp/docentes')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar el catálogo de profesores.')
  }

  return (response.data ?? [])
    .filter(
      (docente) =>
        docente.tieneRolDocentePosgrados &&
        Boolean(docente.fullName?.trim()) &&
        Boolean(docente.uuid?.trim()),
    )
    .map((docente) => ({
      uuid: docente.uuid.trim(),
      id: null,
      existeEnSapp: true,
      nombre: docente.fullName.trim(),
    }))
}
