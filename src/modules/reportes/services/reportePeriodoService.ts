import { httpPostFile } from '../../../shared/http/httpClient'

export type TipoReportePeriodo = 'MATRICULA' | 'CREDITOS_CONDONABLES'

export interface GenerarReportePeriodoRequest {
  actaId: number
  periodoId: number
  programaId: number
}

export interface ReportePeriodoGenerado extends GenerarReportePeriodoRequest {
  blob: Blob
  filename: string
  mimeType: string
  generatedAt: string
}

const REPORT_CONFIG: Record<TipoReportePeriodo, { endpoint: string; filenamePrefix: string; label: string }> = {
  MATRICULA: {
    endpoint: '/sapp/reportesMatricula/generar',
    filenamePrefix: 'informe-matricula',
    label: 'matrícula',
  },
  CREDITOS_CONDONABLES: {
    endpoint: '/sapp/reportesCreditosCondonables/generar',
    filenamePrefix: 'informe-creditos-condonables',
    label: 'créditos condonables',
  },
}

export async function generarReportePeriodo(
  tipo: TipoReportePeriodo,
  request: GenerarReportePeriodoRequest,
): Promise<ReportePeriodoGenerado> {
  const config = REPORT_CONFIG[tipo]
  const query = new URLSearchParams({
    actaId: String(request.actaId),
    periodoId: String(request.periodoId),
    programaId: String(request.programaId),
  })
  const response = await httpPostFile(`${config.endpoint}?${query.toString()}`)

  if (response.blob.size === 0) {
    throw new Error(`El servicio no retornó contenido para el informe de ${config.label}.`)
  }

  const mimeType = response.contentType.includes('pdf') ? response.contentType : 'application/pdf'
  const fallbackFilename = `${config.filenamePrefix}-acta-${request.actaId}-periodo-${request.periodoId}-programa-${request.programaId}.pdf`

  return {
    ...request,
    blob: response.blob.type === mimeType
      ? response.blob
      : response.blob.slice(0, response.blob.size, mimeType),
    filename: response.filename || fallbackFilename,
    mimeType,
    generatedAt: new Date().toISOString(),
  }
}
