export interface TipoTramiteDto {
  id: number
  codigo: number
  nombre: string
}

export interface TramiteDocumentoDto {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  obligatorio: boolean
  activo: boolean
  tipoTramite: TipoTramiteDto
}
