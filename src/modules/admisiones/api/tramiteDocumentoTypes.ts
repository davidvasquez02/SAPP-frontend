export interface TramiteDocumentoTipoDto {
  codigo?: number | string | null
  id?: number | null
  nombre?: string | null
}

export interface TramiteDocumentoDto {
  activo?: boolean
  codigo?: string | null
  descripcion?: string | null
  id: number
  nombre: string
  obligatorio: boolean
  tipoTramite?: TramiteDocumentoTipoDto | string | null
  nombreTipoTramite?: string | null
}

export interface TramiteDocumentoUploadItem {
  idTipoDocumentoTramite: number
  codigoTipoDocumentoTramite: string
  nombre: string
  descripcion: string | null
  obligatorio: boolean
  tipoTramiteNombre: string
}
