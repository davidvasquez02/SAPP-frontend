export interface GrupoGestionDto {
  id: number
  codigo: string
  nombre: string
  institucionId: number
  institucionNombre: string
  estado: 'ACTIVO' | 'RETIRADO'
}

export interface InstitucionGrupoDto {
  id: number
  nombre: string
  interna: boolean
}

export interface GrupoGestionRequest {
  codigo: string
  nombre: string
  institucionId: number
}
