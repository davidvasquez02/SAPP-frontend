export type EstadoSolicitud = 'REGISTRADA' | 'EN REVISION' | 'APROBADA' | 'RECHAZADA'

const ESTADO_MAP: Record<string, EstadoSolicitud> = {
  REGISTRADA: 'REGISTRADA',
  REGISTRADO: 'REGISTRADA',
  EN_ESTUDIO: 'EN REVISION',
  'EN ESTUDIO': 'EN REVISION',
  EN_REVISION: 'EN REVISION',
  'EN REVISION': 'EN REVISION',
  APROBADA: 'APROBADA',
  APROBADO: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  RECHAZADO: 'RECHAZADA',
}

export function normalizeEstadoSolicitud(value: string | null | undefined): EstadoSolicitud | 'UNKNOWN' {
  if (!value) {
    return 'UNKNOWN'
  }

  const normalized = value.trim().toUpperCase()
  return ESTADO_MAP[normalized] ?? 'UNKNOWN'
}
