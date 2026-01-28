export interface LoginRequestDto {
  username: string
  password: string
}

export interface PersonaDto {
  id: number
  tipoDocumento: string
  numeroDocumento: string
  nombre1: string
  nombre2?: string | null
  apellido1: string
  apellido2?: string | null
  emailInstitucional?: string | null
  emailPersonal?: string | null
  telefono?: string | null
}

export interface LoginResponseDataDto {
  id: number
  username: string
  authId: number
  activo: boolean
  fechaCreacion: string
  lastLogin?: string | null
  persona: PersonaDto
}
