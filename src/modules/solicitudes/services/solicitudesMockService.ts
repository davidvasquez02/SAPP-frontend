import { solicitudesCoordinadorMockResponse } from '../mock/solicitudesCoordinador.mock'
import { solicitudesEstudianteMockResponse } from '../mock/solicitudesEstudiante.mock'
import { tipoSolicitudMockResponse } from '../mock/tipoSolicitud.mock'
import type { SolicitudCoordinadorDto, SolicitudEstudianteRowDto, TipoSolicitudDto } from '../types'

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
  await wait(200)
  return solicitudesCoordinadorMockResponse.data
}

export async function fetchSolicitudesEstudiante(codigoEstudianteUis = '20260001'): Promise<SolicitudEstudianteRowDto[]> {
  await wait(200)
  return solicitudesEstudianteMockResponse.data.filter(
    (solicitud) => solicitud.codigoEstudianteUis === codigoEstudianteUis,
  )
}
