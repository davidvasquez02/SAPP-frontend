export interface AspiranteCreateRequestDto {
  tipoDocumentoIdentificacionId: number
  numeroDocumento: string
  emailPersonal: string
  numeroInscripcionUis: string
  observaciones?: string | null
  programaId: number
  convocatoriaAdmisionId: number
  nombre1: string
  nombre2?: string | null
  apellido1: string
  apellido2?: string | null
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

/**
 * Contrato retornado por las consultas de aspirantes.
 *
 * El nombre de la persona llega desagregado desde el IDP. Este DTO se mantiene
 * separado de la respuesta de creación porque el cambio de contrato informado
 * aplica a los endpoints GET, no al POST.
 */
export interface AspiranteConsultaResponseDto {
  id: number
  inscripcionAdmisionId: number
  nombre1: string
  nombre2: string | null
  apellido1: string
  apellido2: string | null
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
