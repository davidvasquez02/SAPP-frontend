import type { DocumentoTramiteItemDto } from '../api/types'

export type DocumentoValidacionEstado = 'SIN_VALIDAR' | 'APROBADO' | 'RECHAZADO'

export interface DocumentoTramiteUiItem extends DocumentoTramiteItemDto {
  validacionEstado: DocumentoValidacionEstado
  validacionObservaciones?: string | null
}
