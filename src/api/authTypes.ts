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
  codigoEstudianteUis: string
  cohorte: number
  estado: string
  fechaIngreso: string
  idAspirante: number | null
  programaCodigoNombre: string
  programaId: number
  foto?: EstudianteFotoDto | null
  [key: string]: unknown
}

export interface AspiranteDetalleDto {
  id: number
  apellido1: string
  apellido2: string | null
  emailPersonal: string | null
  nombre1: string
  nombre2: string | null
  numeroDocumento: string
  numeroInscripcionUis: number
  telefono: string | null
  tipoDocumentoIdentificacion: string
}

export interface PersonaDetalleDto {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  attributes: Record<string, string[]>
}

export interface DocenteDetalleDto {
  id: number
  [key: string]: unknown
}

export interface LoginDetalleDto {
  aspirante: AspiranteDetalleDto | null
  docente: DocenteDetalleDto | null
  estudiante: EstudianteDto | null
  persona: PersonaDetalleDto
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
  detalle: LoginDetalleDto
}
