export interface AspiranteConsultaInfoDto {
  id: number
  director?: string | null
  grupoInvestigacion?: string | null
  nombre?: string | null
  telefono?: string | null
  numeroInscripcionUis: number | string
  tipoDocumentoIdentificacion: string
  numeroDocumento: string
  emailPersonal?: string | null
  fechaRegistro?: string | null
  inscripcionAdmisionId?: number | null
  observaciones?: string | null
}
