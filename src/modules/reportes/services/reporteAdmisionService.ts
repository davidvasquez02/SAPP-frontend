import { httpPostFile } from '../../../shared/http/httpClient'

export interface GenerarReporteAdmisionRequest {
  actaId: number
  convocatoriaId: number
}

export interface ReporteAdmisionGenerado {
  blob: Blob
  filename: string
  mimeType: string
  generatedAt: string
  actaId: number
  convocatoriaId: number
}

const buildReporteFilename = (actaId: number, convocatoriaId: number) =>
  `informe-admision-acta-${actaId}-convocatoria-${convocatoriaId}.pdf`

export async function generarReporteAdmision({
  actaId,
  convocatoriaId,
}: GenerarReporteAdmisionRequest): Promise<ReporteAdmisionGenerado> {
  const query = new URLSearchParams({
    actaId: String(actaId),
    convocatoriaId: String(convocatoriaId),
  })
  const response = await httpPostFile(
    `/sapp/reportesAdmision/generar?${query.toString()}`,
  )

  if (response.blob.size === 0) {
    throw new Error('El servicio no retornó contenido para el informe de admisión.')
  }

  const mimeType = response.contentType.includes('pdf') ? response.contentType : 'application/pdf'

  return {
    blob: response.blob.type === mimeType ? response.blob : response.blob.slice(0, response.blob.size, mimeType),
    filename: response.filename || buildReporteFilename(actaId, convocatoriaId),
    mimeType,
    generatedAt: new Date().toISOString(),
    actaId,
    convocatoriaId,
  }
}
