export interface GrupoInvestigacionDto {
  id: number
  codigoNombre: string
  institucionId?: number | null
  institucionNombre?: string | null
  facultadId?: number | null
  facultadNombre?: string | null
}

export interface GrupoInvestigacionDocenteDto {
  esDirector: boolean
  existeEnSapp: boolean
  id: number
  nombre: string
  uuid: string | null
  docenteId?: number
  docenteUuid?: string
}

export interface DocenteDto {
  uuid: string
  fullName: string
  email: string
  documentNumber: string
  tieneRolDocentePosgrados: boolean
}

export interface RegistrarDocenteGrupoRequest {
  grupoId: number
  docenteUuid: string
}
