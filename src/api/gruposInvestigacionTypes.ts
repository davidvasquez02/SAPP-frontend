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
  id: number
  uuid: string
  nombre: string
}

export interface RegistrarDocenteGrupoRequest {
  grupoId: number
  docenteUuid: string
}
