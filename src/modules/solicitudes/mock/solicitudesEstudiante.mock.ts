import { solicitudesCoordinadorMockResponse } from './solicitudesCoordinador.mock'
import type { ApiResponse, SolicitudEstudianteRowDto } from '../types'

export const solicitudesEstudianteMockResponse: ApiResponse<SolicitudEstudianteRowDto[]> = {
  ok: true,
  message: 'Consulta exitosa',
  data: solicitudesCoordinadorMockResponse.data
    .filter((solicitud) => solicitud.codigoEstudianteUis === '20260001')
    .map((solicitud) => ({
      id: solicitud.id,
      tipoSolicitudCodigo: solicitud.tipoSolicitudCodigo,
      tipoSolicitud: solicitud.tipoSolicitud,
      estadoSigla: solicitud.estadoSigla,
      estado: solicitud.estado,
      fechaRegistro: solicitud.fechaRegistro,
      fechaResolucion: solicitud.fechaResolucion,
      observaciones: solicitud.observaciones,
      programaAcademico: solicitud.programaAcademico,
      codigoEstudianteUis: solicitud.codigoEstudianteUis,
    })),
}
