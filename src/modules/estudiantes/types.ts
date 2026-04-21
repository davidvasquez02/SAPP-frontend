export interface ProgramaCoordinacion {
  id: number
  codigo: string
  nombre: string
}

export interface EstudianteCoordinacion {
  id: number
  codigo: string
  nombreCompleto: string
  fotoUrl: string | null
  tipoDocumento: string
  numeroDocumento: string
  correoInstitucional: string
  estadoAcademico: 'ACTIVO' | 'EN_TRABAJO_DE_GRADO' | 'EN_ESPERA_CANDIDATURA' | string
  cohorte: string
  promedioAcumulado: number
  creditosAprobados: number
  creditosPendientes: number
  programaId: number
  programaNombre: string
  fechaIngreso: string
}


export interface DocumentoResumen {
  idTipoDocumentoTramite: number
  codigoTipoDocumentoTramite: string
  nombreTipoDocumentoTramite: string
  documentoCargado: boolean
  documentoUploadedResponse: {
    idDocumento: number
    nombreArchivoDocumento: string
    fechaCargaDocumento: string
  } | null
}

export interface MatriculaResumen {
  id: number
  periodoAcademico: string
  estado: string
  fechaSolicitud: string
  documentos: DocumentoResumen[]
}

export interface SolicitudResumen {
  id: number
  tipoSolicitud: string
  estado: string
  fechaRegistro: string
  documentos: DocumentoResumen[]
}

export interface AdmisionResumen {
  id: number
  estado: string
  fechaInscripcion: string | null
  fechaResultado: string | null
  puntajeTotal: number | null
  documentos: DocumentoResumen[]
}
