import type { ApiResponse, TipoSolicitudDto } from '../types'

export const tipoSolicitudMockResponse: ApiResponse<TipoSolicitudDto[]> = {
  ok: true,
  message: 'Consulta exitosa',
  data: [
    { codigoNombre: 'PRORROGA - PRORROGA DE TRABAJO DE GRADO', id: 1 },
    { codigoNombre: 'HOMOLOG - HOMOLOGACION DE ASIGNATURAS', id: 2 },
    { codigoNombre: 'CAMBDIR - CAMBIO DE DIRECTOR', id: 3 },
  ],
}
