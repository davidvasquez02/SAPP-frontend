export type EstadoSolicitudSigla =
  | 'ENVIADA'
  | 'EN_REVISION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'DEVUELTA'
  | 'PFIR_DIR_TG'
  | 'PFIR_COOR_POS'
  | 'PFIR_CAR_CONT'
  | 'ENVIADA_CONSEJO'
  | 'JUR_POR_DESIG'
  | 'JUR_INVITADO'
  | 'EN_EVALUACION'
  | 'CONCEPTOS_REC'
  | 'EN_AJUSTES'
  | 'SUST_PROGRAMADA'
  | 'SUSTENTADA'
  | 'APLAZADA'
  | 'NO_APROBADA'

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
  { id: 10, sigla: 'ENVIADA_CONSEJO', label: 'ENVIADA A CONSEJO ACADEMICO' },
  { id: 12, sigla: 'JUR_POR_DESIG', label: 'JURADO POR DESIGNAR' },
  { id: 13, sigla: 'JUR_INVITADO', label: 'JURADO INVITADO' },
  { id: 14, sigla: 'EN_EVALUACION', label: 'EN EVALUACIÓN' },
  { id: 15, sigla: 'CONCEPTOS_REC', label: 'CONCEPTOS RECIBIDOS' },
  { id: 16, sigla: 'EN_AJUSTES', label: 'EN AJUSTES DEL ESTUDIANTE' },
  { id: 17, sigla: 'SUST_PROGRAMADA', label: 'SUSTENTACIÓN PROGRAMADA' },
  { id: 18, sigla: 'SUSTENTADA', label: 'SUSTENTADA' },
  { id: 19, sigla: 'APLAZADA', label: 'APLAZADA' },
  { id: 20, sigla: 'NO_APROBADA', label: 'NO APROBADA' },
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
  ENVIADA_CONSEJO: 'ENVIADA_CONSEJO',
  'ENVIADA A CONSEJO': 'ENVIADA_CONSEJO',
  'ENVIADA A CONSEJO ACADEMICO': 'ENVIADA_CONSEJO',
  'ENVIADA A CONSEJO ACADÉMICO': 'ENVIADA_CONSEJO',
  JUR_POR_DESIG: 'JUR_POR_DESIG',
  JUR_INVITADO: 'JUR_INVITADO',
  EN_EVALUACION: 'EN_EVALUACION',
  CONCEPTOS_REC: 'CONCEPTOS_REC',
  EN_AJUSTES: 'EN_AJUSTES',
  SUST_PROGRAMADA: 'SUST_PROGRAMADA',
  SUSTENTADA: 'SUSTENTADA',
  APLAZADA: 'APLAZADA',
  NO_APROBADA: 'NO_APROBADA',
}

export const ESTADOS_SOLICITUD_SIGLAS = Object.freeze(
  DEFAULT_ESTADOS_SOLICITUD_CATALOG.map((estado) => estado.sigla),
) as ReadonlyArray<EstadoSolicitudSigla>

export function setEstadoSolicitudCatalog(items: EstadoSolicitudCatalogItem[]): void {
  if (items.length === 0) {
    estadosSolicitudCatalog = [...DEFAULT_ESTADOS_SOLICITUD_CATALOG]
  } else {
    estadosSolicitudCatalog = items
      .map((estado) => ({
        ...estado,
        label: estado.label.trim().toLocaleUpperCase('es-CO') || estado.sigla,
      }))
      .sort((left, right) => left.id - right.id)
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

const normalizeProgramaAcademico = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

/** Ajusta el nombre visible del estado de firma al nivel del programa del estudiante. */
export function getEstadoSolicitudLabelPorPrograma(
  value: string | null | undefined,
  programaAcademico?: string | null,
): string {
  if (normalizeEstadoSolicitud(value) !== 'PFIR_DIR_TG' || !programaAcademico) {
    return getEstadoSolicitudLabel(value)
  }

  const programa = normalizeProgramaAcademico(programaAcademico)
  if (programa.includes('DOCTORADO') || /\bDCC\b/.test(programa)) {
    return 'POR FIRMA DIRECTOR DE TESIS'
  }
  if (programa.includes('MAESTRIA') || /\bMISI\b/.test(programa)) {
    return 'POR FIRMA DIRECTOR DE TRABAJO INVESTIGACION'
  }

  return getEstadoSolicitudLabel(value)
}

type SolicitudConEstado = {
  estadoId?: number | null
  estadoSigla?: string | null
  estado?: string | null
}

/** Retorna únicamente los estados que están representados en el listado recibido. */
export function getEstadosPresentesEnSolicitudes(
  catalog: EstadoSolicitudCatalogItem[],
  solicitudes: SolicitudConEstado[],
): EstadoSolicitudCatalogItem[] {
  const estadoIds = new Set(
    solicitudes
      .map((solicitud) => solicitud.estadoId)
      .filter((estadoId): estadoId is number => typeof estadoId === 'number'),
  )
  const estadoSiglas = new Set(
    solicitudes
      .map((solicitud) => normalizeEstadoSolicitud(solicitud.estadoSigla || solicitud.estado))
      .filter((sigla): sigla is EstadoSolicitudSigla => sigla !== 'UNKNOWN'),
  )

  return catalog.filter((estado) => estadoIds.has(estado.id) || estadoSiglas.has(estado.sigla))
}
