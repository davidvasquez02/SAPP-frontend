import { solicitudesCoordinadorMockResponse } from '../mock/solicitudesCoordinador.mock'
import { tipoSolicitudMockResponse } from '../mock/tipoSolicitud.mock'
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
  await wait(200)
  return solicitudesCoordinadorMockResponse.data
}
