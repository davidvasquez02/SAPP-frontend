export type EstadoSolicitud = 'REGISTRADA' | 'EN ESTUDIO' | 'APROBADA' | 'RECHAZADA'

const ESTADO_MAP: Record<string, EstadoSolicitud> = {
  REGISTRADA: 'REGISTRADA',
  REGISTRADO: 'REGISTRADA',
  EN_ESTUDIO: 'EN ESTUDIO',
  'EN ESTUDIO': 'EN ESTUDIO',
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
