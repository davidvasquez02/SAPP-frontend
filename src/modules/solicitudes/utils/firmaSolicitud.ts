const ESTADOS_FIRMA = new Set(['PFIR_DIR_TG', 'PFIR_COOR_POS', 'PFIR_CAR_CONT'])

export const estadoPermiteFirmaSolicitud = (...estados: Array<string | null | undefined>): boolean =>
  estados.some((estado) => {
    const normalized = estado?.trim().toLocaleUpperCase() ?? ''
    return normalized.includes('POR FIRMA') || ESTADOS_FIRMA.has(normalized)
  })

interface FirmaSolicitudAccess {
  esGestionPosgrados: boolean
  esDocente: boolean
  estaAsignadaAlUsuario: boolean
  estado?: string | null
  estadoSigla?: string | null
}

export const puedeFirmarDocumentosSolicitud = ({
  esGestionPosgrados,
  esDocente,
  estaAsignadaAlUsuario,
  estado,
  estadoSigla,
}: FirmaSolicitudAccess): boolean =>
  estadoPermiteFirmaSolicitud(estado, estadoSigla)
  && (esGestionPosgrados || (esDocente && estaAsignadaAlUsuario))
