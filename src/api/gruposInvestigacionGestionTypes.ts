export interface GrupoGestionDto {
  id: number
  codigo: string
  nombre: string
  institucionId: number
  institucionNombre: string
  estado: 'ACTIVO' | 'RETIRADO'
}

export type TipoInstitucionGrupo = 'FACULTAD' | 'ESCUELA'

export interface InstitucionGrupoDto {
  id: number
  nombre: string
  interna: boolean
  tipo: TipoInstitucionGrupo
  institucionPadreId: number | null
  institucionPadreNombre: string | null
}

export interface InstitucionGrupoRequest {
  nombre: string
  tipo?: TipoInstitucionGrupo
  institucionPadreId?: number | null
}

export interface GrupoGestionRequest {
  codigo: string
  nombre: string
  institucionId: number
}
