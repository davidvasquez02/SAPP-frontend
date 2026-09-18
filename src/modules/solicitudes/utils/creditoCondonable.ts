import type { SolicitudAcademicaDto, TipoSolicitudDto } from '../api/types'

export const CREDITOS_CONDONABLES_CODES = new Set(['CRED_COND', 'RENOV_CRED_COND'])

export const normalizeTipoSolicitudCode = (value: string | null | undefined): string =>
  value?.split(' - ', 1)[0]?.trim().toLocaleUpperCase() ?? ''

export const isTipoCreditoCondonable = (value: string | null | undefined): boolean =>
  CREDITOS_CONDONABLES_CODES.has(normalizeTipoSolicitudCode(value))

export const isSolicitudCreditoCondonable = (
  solicitud: Pick<SolicitudAcademicaDto, 'tipoSolicitudCodigo'>,
): boolean => isTipoCreditoCondonable(solicitud.tipoSolicitudCodigo)

export const isTipoSolicitudCreditoCondonable = (tipo: TipoSolicitudDto): boolean =>
  isTipoCreditoCondonable(tipo.codigoNombre ?? tipo.nombre)
