import { solicitudesCoordinadorMockResponse } from './solicitudesCoordinador.mock'
import { tipoSolicitudMockResponse } from './tipoSolicitud.mock'
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

const toTipoSolicitudMap = () =>
  new Map(
    tipoSolicitudMockResponse.data.map((tipo) => {
      const [codigo = '', nombre = tipo.codigoNombre] = tipo.codigoNombre.split(' - ')
      return [tipo.id, { codigo, nombre }]
    }),
  )

const ensureStudentSeed = (rows: SolicitudCoordinadorDto[]): SolicitudCoordinadorDto[] => {
  const hasSeed = rows.some((row) => row.id === 10)
  if (hasSeed) {
    return rows
  }

  return [
    {
      id: 10,
      estadoSigla: 'REGISTRADA',
      estado: 'REGISTRADA',
      estadoId: 1,
      tipoSolicitudId: 1,
      tipoSolicitudCodigo: 'PRORROGA',
      tipoSolicitud: 'PRORROGA DE TRABAJO DE GRADO',
      fechaRegistro: '2026-03-31',
      fechaResolucion: null,
      observaciones: 'Ejemplo estudiante: solicitud registrada',
      programaAcademico: '61412 - MISI',
      codigoEstudianteUis: '20260001',
      estudianteId: 2,
      estudiante: 'MARIO MENDOZA',
    },
    ...rows,
  ]
}

const solicitudesStore: SolicitudCoordinadorDto[] = ensureStudentSeed(
  solicitudesCoordinadorMockResponse.data.map(toStoreRow),
)

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

export const updateSolicitudEstudianteMock = (params: {
  id: number
  tipoSolicitudId: number
  observaciones: string
}): SolicitudCoordinadorDto => {
  const solicitudIndex = solicitudesStore.findIndex((solicitud) => solicitud.id === params.id)

  if (solicitudIndex < 0) {
    throw new Error('Solicitud no encontrada')
  }

  const solicitud = solicitudesStore[solicitudIndex]
  const tipoSolicitudMap = toTipoSolicitudMap()
  const tipoSolicitud = tipoSolicitudMap.get(params.tipoSolicitudId)

  if (!tipoSolicitud) {
    throw new Error('Tipo de solicitud no encontrado')
  }

  const nextSolicitud: SolicitudCoordinadorDto = {
    ...solicitud,
    tipoSolicitudId: params.tipoSolicitudId,
    tipoSolicitudCodigo: tipoSolicitud.codigo,
    tipoSolicitud: tipoSolicitud.nombre,
    observaciones: params.observaciones,
  }

  solicitudesStore[solicitudIndex] = nextSolicitud
  return cloneSolicitud(nextSolicitud)
}
