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

/**
 * Contrato retornado por las consultas de aspirantes.
 *
 * El nombre de la persona llega desagregado desde el IDP tanto en consultas
 * como en la respuesta de creación.
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

/** Una fila del Excel de aspirantes ya interpretada por el backend (ver POST /aspirante/importar-excel). */
export interface AspiranteExcelFilaDto {
  fila: number
  nombreOriginal: string
  nombre1: string | null
  nombre2: string | null
  apellido1: string | null
  apellido2: string | null
  tipoDocumentoIdentificacionId: number | null
  tipoDocumentoNombre: string | null
  numeroDocumento: string | null
  emailPersonal: string | null
  telefono: string | null
  numeroInscripcionUis: string | null
  programaId: number | null
  /** Razones por las que la fila no se puede crear; vacío si es válida. */
  errores: string[]
  valida: boolean
}

export interface ImportacionAspirantesExcelDto {
  programaConvocatoria: string
  filas: AspiranteExcelFilaDto[]
}
