import type { ApiResponse } from '../../../api/types'

export type { ApiResponse }

export type IdiomaJurado = 'ES' | 'EN'

export interface CatalogoEvaluacionItem {
  codigo: string
  nombre: string
  descripcion: string | null
}

export interface CatalogosEvaluacion {
  estadosInvitacion: CatalogoEvaluacionItem[]
  momentos: CatalogoEvaluacionItem[]
  conceptos: CatalogoEvaluacionItem[]
  resultados: CatalogoEvaluacionItem[]
  modalidades: CatalogoEvaluacionItem[]
}

export interface EvaluacionJurado {
  id: number
  momentoCodigo: string
  momento?: string | null
  momentoNombre?: string | null
  conceptoCodigo?: string | null
  conceptoNombre?: string | null
  concepto?: string | null
  resultadoCodigo?: string | null
  resultado?: string | null
  resultadoNombre?: string | null
  nota?: number | null
  observaciones?: string | null
  rubricaNombreArchivo?: string | null
  rubricaFechaCarga?: string | null
  fechaRegistro?: string | null
  /** 1 = concepto original; 2 en adelante = los emitidos tras las correcciones del estudiante. */
  ronda?: number | null
}

export interface JuradoEvaluador {
  id: number
  orden?: number
  nombre: string
  tratamiento?: string | null
  /** Tratamiento para los correos en inglés; nulo = el genérico Professor. */
  tratamientoEn?: string | null
  correo: string
  institucion: string | null
  externo: boolean
  idioma?: IdiomaJurado
  activo: boolean
  estadoInvitacion: string
  estadoInvitacionNombre?: string | null
  estadoInvitacionCodigo?: string | null
  fechaInvitacion?: string | null
  fechaRespuesta?: string | null
  fechaLimiteEvaluacion?: string | null
  motivoDeclinacion?: string | null
  /** Por qué el coordinador reemplazó o retiró al jurado; independiente de motivoDeclinacion. */
  motivoReemplazo?: string | null
  nombreSugerido?: string | null
  correoSugerido?: string | null
  evaluaciones: EvaluacionJurado[]
}

export interface SustentacionEvaluacion {
  id?: number | null
  fechaSustentacion: string
  modalidadCodigo: string
  modalidadNombre?: string | null
  lugar?: string | null
  enlace?: string | null
}

export interface DocumentoEvaluacion {
  id: number
  nombre?: string | null
  nombreArchivo?: string | null
  mimeType?: string | null
  fechaCarga?: string | null
}

export interface HistorialProcesoEvaluacion {
  estadoNuevoSigla: string
  estadoNuevo: string
  fecha: string
  responsable: string | null
  detalle: string | null
}

export interface ProcesoEvaluacionTg {
  id?: number | null
  solicitudId?: number
  solicitudAcademicaId?: number
  tipoSolicitudCodigo: string
  tipoSolicitudNombre?: string | null
  titulo: string
  resumen?: string | null
  nombreEstudiante?: string
  estudiante?: string
  programa: string
  estadoSolicitud: string
  estadoSolicitudNombre?: string | null
  fechaLimiteEvaluacion?: string | null
  documentoEvaluarId?: number | null
  documentoEvaluarNombre?: string | null
  cartaRespuestasId?: number | null
  cartaRespuestasNombre?: string | null
  documentos?: DocumentoEvaluacion[]
  jurados: JuradoEvaluador[]
  sustentacion?: SustentacionEvaluacion | null
  fechaSustentacion?: string | null
  modalidadSustentacionCodigo?: string | null
  modalidadSustentacion?: string | null
  lugarSustentacion?: string | null
  enlaceSustentacion?: string | null
  resultadoCodigo?: string | null
  resultadoNombre?: string | null
  resultado?: string | null
  fechaResultado?: string | null
  sustentacionConNota?: boolean
  /** Ronda de conceptos vigente: sube en uno cada vez que el estudiante entrega correcciones. */
  rondaConceptos?: number | null
  notaFinal?: number | null
  actaId?: number | null
  historial?: HistorialProcesoEvaluacion[]
}

export interface BancoJurado {
  nombre: string
  tratamiento?: string | null
  tratamientoEn?: string | null
  correo: string
  institucion?: string | null
  externo?: boolean
  idioma?: IdiomaJurado
  participaciones: number
  ultimaParticipacion?: string | null
}

export interface JuradoInput {
  nombre: string
  tratamiento?: string
  tratamientoEn?: string
  correo: string
  institucion: string
  externo: boolean
  idioma: IdiomaJurado
  motivoReemplazo?: string
}

export interface DesignarJuradosRequest {
  jurados: JuradoInput[]
  fechaLimiteEvaluacion: string
  documentoEvaluarId: number
  enviarInvitaciones: boolean
}

export interface ProgramarSustentacionRequest {
  fechaSustentacion: string
  modalidadCodigo: string
  lugar: string | null
  enlace: string | null
  notificarJurados: boolean
}

export interface RegistrarResultadoRequest {
  resultadoCodigo: string
  notaFinal: number | null
  actaId: number | null
}

export interface RubricaDiligenciadaDto {
  nombreArchivo: string
  mimeType: string
  tamanoBytes: number
  contenidoBase64: string
}
