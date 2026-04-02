import { solicitudesCoordinadorMockResponse } from './solicitudesCoordinador.mock'
import type { SolicitudCoordinadorDto } from '../types'

export type EstadoSolicitudEditable = 'EN ESTUDIO' | 'APROBADA' | 'RECHAZADA'

const ESTADO_ID_MAP: Record<EstadoSolicitudEditable, number> = {
  'EN ESTUDIO': 2,
  APROBADA: 3,
  RECHAZADA: 4,
}

const normalizeEstadoSigla = (estadoSigla: string) => estadoSigla.replaceAll('_', ' ')

const toStoreRow = (solicitud: SolicitudCoordinadorDto): SolicitudCoordinadorDto => {
  const estadoSiglaNormalizada = normalizeEstadoSigla(solicitud.estadoSigla)
  return {
    ...solicitud,
    estado: estadoSiglaNormalizada,
    estadoSigla: estadoSiglaNormalizada,
  }
}

const cloneSolicitud = (solicitud: SolicitudCoordinadorDto): SolicitudCoordinadorDto => ({ ...solicitud })

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const solicitudesStore: SolicitudCoordinadorDto[] = solicitudesCoordinadorMockResponse.data.map(toStoreRow)

export const getAllSolicitudesMock = (): SolicitudCoordinadorDto[] => solicitudesStore.map(cloneSolicitud)

export const getSolicitudesByEstudianteMock = (estudianteId: number): SolicitudCoordinadorDto[] =>
  solicitudesStore.filter((solicitud) => solicitud.estudianteId === estudianteId).map(cloneSolicitud)

export const getSolicitudByIdMock = (id: number): SolicitudCoordinadorDto | null => {
  const solicitud = solicitudesStore.find((row) => row.id === id)
  return solicitud ? cloneSolicitud(solicitud) : null
}

export const updateSolicitudEstadoMock = (params: {
  id: number
  estadoSigla: EstadoSolicitudEditable
}): SolicitudCoordinadorDto => {
  const solicitudIndex = solicitudesStore.findIndex((solicitud) => solicitud.id === params.id)

  if (solicitudIndex < 0) {
    throw new Error('Solicitud no encontrada')
  }

  const solicitud = solicitudesStore[solicitudIndex]
  const nextEstado = params.estadoSigla

  const nextSolicitud: SolicitudCoordinadorDto = {
    ...solicitud,
    estado: nextEstado,
    estadoSigla: nextEstado,
    estadoId: ESTADO_ID_MAP[nextEstado],
    fechaResolucion:
      nextEstado === 'APROBADA' || nextEstado === 'RECHAZADA'
        ? solicitud.fechaResolucion ?? getTodayDate()
        : null,
  }

  solicitudesStore[solicitudIndex] = nextSolicitud
  return cloneSolicitud(nextSolicitud)
}
