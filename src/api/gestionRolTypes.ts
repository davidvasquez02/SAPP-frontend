export interface UsuarioIamDto {
  uuid: string
  fullName: string
  email: string
  documentNumber: string | null
}

export interface GestionRolRequest {
  usuarioUuid: string
  rol: string
}
