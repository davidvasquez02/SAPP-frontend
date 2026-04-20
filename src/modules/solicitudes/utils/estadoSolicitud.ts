export type EstadoSolicitudSigla =
  | 'ENVIADA'
  | 'EN_REVISION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'DEVUELTA'
  | 'PFIR_DIR_TG'
  | 'PFIR_COOR_POS'
  | 'PFIR_CAR_CONT'

export interface EstadoSolicitudCatalogItem {
  id: number
  sigla: EstadoSolicitudSigla
  label: string
}

export const DEFAULT_ESTADOS_SOLICITUD_CATALOG: EstadoSolicitudCatalogItem[] = [
  { id: 1, sigla: 'ENVIADA', label: 'ENVIADA A COMITE ASESOR DE POSGRADOS' },
  { id: 2, sigla: 'EN_REVISION', label: 'EN REVISION POR COMITE ASESOR DE POSGRADOS' },
  { id: 3, sigla: 'APROBADA', label: 'APROBADA' },
  { id: 4, sigla: 'RECHAZADA', label: 'RECHAZADA' },
  { id: 5, sigla: 'DEVUELTA', label: 'DEVUELTA' },
  { id: 6, sigla: 'PFIR_DIR_TG', label: 'POR FIRMA DIRECTOR DE TG' },
  { id: 7, sigla: 'PFIR_COOR_POS', label: 'POR FIRMA COORDINADOR DE POSGRADOS' },
  { id: 8, sigla: 'PFIR_CAR_CONT', label: 'POR FIRMA CARTA CONTRAPRESTACION' },
]

let estadosSolicitudCatalog = [...DEFAULT_ESTADOS_SOLICITUD_CATALOG]
let estadoBySigla = new Map(estadosSolicitudCatalog.map((estado) => [estado.sigla, estado]))

const ESTADO_SIGLA_MAP: Record<string, EstadoSolicitudSigla> = {
  ENVIADA: 'ENVIADA',
  REGISTRADA: 'ENVIADA',
  REGISTRADO: 'ENVIADA',
  EN_REVISION: 'EN_REVISION',
  'EN REVISION': 'EN_REVISION',
  EN_ESTUDIO: 'EN_REVISION',
  'EN ESTUDIO': 'EN_REVISION',
  APROBADA: 'APROBADA',
  APROBADO: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  RECHAZADO: 'RECHAZADA',
  DEVUELTA: 'DEVUELTA',
  PFIR_DIR_TG: 'PFIR_DIR_TG',
  PFIR_COOR_POS: 'PFIR_COOR_POS',
  PFIR_CAR_CONT: 'PFIR_CAR_CONT',
}

export const ESTADOS_SOLICITUD_SIGLAS = Object.freeze(
  DEFAULT_ESTADOS_SOLICITUD_CATALOG.map((estado) => estado.sigla),
) as ReadonlyArray<EstadoSolicitudSigla>

export function setEstadoSolicitudCatalog(items: EstadoSolicitudCatalogItem[]): void {
  if (items.length === 0) {
    estadosSolicitudCatalog = [...DEFAULT_ESTADOS_SOLICITUD_CATALOG]
  } else {
    estadosSolicitudCatalog = [...items].sort((left, right) => left.id - right.id)
  }

  estadoBySigla = new Map(estadosSolicitudCatalog.map((estado) => [estado.sigla, estado]))
}

export function getEstadoSolicitudCatalog(): EstadoSolicitudCatalogItem[] {
  return [...estadosSolicitudCatalog]
}

export function normalizeEstadoSolicitud(value: string | null | undefined): EstadoSolicitudSigla | 'UNKNOWN' {
  if (!value) {
    return 'UNKNOWN'
  }

  const normalized = value.trim().toUpperCase()
  return ESTADO_SIGLA_MAP[normalized] ?? 'UNKNOWN'
}

export function getEstadoSolicitudLabel(value: string | null | undefined): string {
  const sigla = normalizeEstadoSolicitud(value)
  if (sigla === 'UNKNOWN') {
    return 'DESCONOCIDO'
  }

  return estadoBySigla.get(sigla)?.label ?? sigla
}
