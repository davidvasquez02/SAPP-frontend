export interface AspiranteCreateRequestDto {
  tipoDocumentoIdentificacionId: number
  numeroDocumento: string
  emailPersonal: string
  numeroInscripcionUis: string
  observaciones?: string | null
  programaId: number
  nombre: string
  telefono?: string | null
}

export interface AspiranteCreateResponseDto {
  id: number
  inscripcionAdmisionId: number
  nombre: string
  numeroDocumento: string
  numeroInscripcionUis: number | string
  emailPersonal: string
  telefono: string | null
  observaciones: string | null
  tipoDocumentoIdentificacion: string
  fechaRegistro: string
  director: string | null
  grupoInvestigacion: string | null
}
