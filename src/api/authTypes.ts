export interface LoginRequestDto {
  username: string
  password: string
}

export interface RolDto {
  id: number
  codigo: string
  nombre: string
}

export interface PersonaDto {
  id: number
  tipoDocumento: string
  numeroDocumento: string
  nombre1: string
  nombre2: string
  apellido1: string
  apellido2: string
  emailPersonal: string | null
  emailInstitucional: string | null
  telefono: string | null
}

export interface LoginResponseDto {
  id: number
  username: string
  authId: number
  activo: boolean
  fechaCreacion: string
  lastLogin: string
  persona: PersonaDto
  roles: RolDto[]
  token: string
}
