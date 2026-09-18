export interface GrupoInvestigacionDto {
  id: number
  codigoNombre: string
}

export interface GrupoInvestigacionDocenteDto {
  id: number
  nombre: string
  uuid?: string
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
