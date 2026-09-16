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
  firstName: string | null
  lastName: string | null
  username: string
  fullName: string
  email: string
  attributes: Record<string, string[]>
}

export interface DocentesPageDto {
  data: DocenteDto[]
  meta: {
    skip: number
    limit: number
    countInPage: number | null
  }
}

export interface RegistrarDocenteGrupoRequest {
  grupoId: number
  docenteUuid: string
}
