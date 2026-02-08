export interface TramiteDocumentoTipoDto {
  codigo: number
  id: number
  nombre: string
}

export interface TramiteDocumentoDto {
  activo: boolean
  codigo: string
  descripcion: string
  id: number
  nombre: string
  obligatorio: boolean
  tipoTramite: TramiteDocumentoTipoDto
}
