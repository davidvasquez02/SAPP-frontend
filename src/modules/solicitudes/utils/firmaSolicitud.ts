const ESTADOS_FIRMA = new Set(['PFIR_DIR_TG', 'PFIR_COOR_POS', 'PFIR_CAR_CONT'])

interface AsignacionSolicitudAccess {
  personaAsignadaId?: number | null
  personaSesionId?: number | null
  incluidaEnSolicitudesAsignadas: boolean
}

export const estaAsignadaSolicitudAlUsuario = ({
  personaAsignadaId,
  personaSesionId,
  incluidaEnSolicitudesAsignadas,
}: AsignacionSolicitudAccess): boolean =>
  personaAsignadaId != null
    ? personaSesionId != null && personaAsignadaId === personaSesionId
    : incluidaEnSolicitudesAsignadas

export const estadoPermiteFirmaSolicitud = (...estados: Array<string | null | undefined>): boolean =>
  estados.some((estado) => {
    const normalized = estado?.trim().toLocaleUpperCase() ?? ''
    return normalized.includes('POR FIRMA') || ESTADOS_FIRMA.has(normalized)
  })

interface FirmaSolicitudAccess {
  estaAsignadaAlUsuario: boolean
  estado?: string | null
  estadoSigla?: string | null
}

export const puedeFirmarDocumentosSolicitud = ({
  estaAsignadaAlUsuario,
  estado,
  estadoSigla,
}: FirmaSolicitudAccess): boolean =>
  estadoPermiteFirmaSolicitud(estado, estadoSigla)
  && estaAsignadaAlUsuario
