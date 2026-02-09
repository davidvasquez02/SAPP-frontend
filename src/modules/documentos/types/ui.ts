import type { DocumentoTramiteItemDto } from '../api/types'

export type DocumentoValidacionEstado = 'PENDIENTE' | 'POR_REVISAR' | 'APROBADO' | 'RECHAZADO'

export interface DocumentoTramiteUiItem extends DocumentoTramiteItemDto {
  validacionEstado: DocumentoValidacionEstado
  validacionObservaciones?: string | null
}
