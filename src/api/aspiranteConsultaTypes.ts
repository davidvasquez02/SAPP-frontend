export interface AspiranteConsultaInfoDto {
  id: number
  numeroInscripcionUis: string
  tipoDocumentoIdentificacion: string
  numeroDocumento: string
  emailPersonal?: string | null
  fechaRegistro?: string | null
  inscripcionAdmisionId?: number | null
  observaciones?: string | null
}
