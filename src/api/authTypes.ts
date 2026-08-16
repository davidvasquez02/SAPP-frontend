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

export interface EstudianteFotoDto {
  documentoId: number
  nombreArchivo: string
  contenidoBase64: string
  mimeType: string
}

export interface EstudianteDto {
  id: number
  foto?: EstudianteFotoDto | null
  [key: string]: unknown
}

export interface GatewayLoginResponseDto {
  id: number
  uuid: string
  username: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  attributes: Record<string, string[]>
  roles: string[]
  clientRoles: string[]
}
