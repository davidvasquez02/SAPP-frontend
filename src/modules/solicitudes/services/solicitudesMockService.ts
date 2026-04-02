import { tipoSolicitudMockResponse } from '../mock/tipoSolicitud.mock'
import {
  getAllSolicitudesMock,
  getSolicitudByIdMock,
  getSolicitudesByEstudianteMock,
  updateSolicitudEstadoMock,
  type EstadoSolicitudEditable,
} from '../mock/solicitudesStore.mock'
import type { SolicitudCoordinadorDto, TipoSolicitudDto } from '../types'

const wait = async (ms: number) => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function fetchTiposSolicitud(): Promise<TipoSolicitudDto[]> {
  await wait(200)
  return tipoSolicitudMockResponse.data
}

export async function fetchSolicitudesCoordinador(): Promise<SolicitudCoordinadorDto[]> {
  await wait(180)
  return getAllSolicitudesMock()
}

export async function fetchSolicitudesEstudiante(estudianteId: number): Promise<SolicitudCoordinadorDto[]> {
  await wait(220)
  return getSolicitudesByEstudianteMock(estudianteId)
}

export async function fetchSolicitudDetalle(id: number): Promise<SolicitudCoordinadorDto> {
  await wait(240)
  const solicitud = getSolicitudByIdMock(id)
  if (!solicitud) {
    throw new Error('Solicitud no encontrada')
  }
  return solicitud
}

export async function updateSolicitudEstado(
  id: number,
  estadoSigla: EstadoSolicitudEditable,
): Promise<SolicitudCoordinadorDto> {
  await wait(200)
  return updateSolicitudEstadoMock({ id, estadoSigla })
}
