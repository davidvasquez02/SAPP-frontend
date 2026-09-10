import { HttpError } from '../../../shared/http/httpClient'

export interface AspiranteConDocumentosFaltantes {
  inscripcionId: number
  documento: string
  nombreCompleto: string
  documentosFaltantes: string[]
}

export interface FaltantesReporte {
  categoriasInstitucionalesFaltantes: string[]
  aspirantesConDocumentosFaltantes: AspiranteConDocumentosFaltantes[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

export const getFaltantesReporte = (error: unknown): FaltantesReporte | null => {
  if (!(error instanceof HttpError) || !isRecord(error.data) || !isRecord(error.data.faltantes)) {
    return null
  }

  const faltantes = error.data.faltantes
  const aspirantes = Array.isArray(faltantes.aspirantesConDocumentosFaltantes)
    ? faltantes.aspirantesConDocumentosFaltantes.flatMap((item) => {
        if (!isRecord(item)) return []
        const inscripcionId = Number(item.inscripcionId)
        if (!Number.isFinite(inscripcionId)) return []
        return [{
          inscripcionId,
          documento: typeof item.documento === 'string' ? item.documento : '',
          nombreCompleto: typeof item.nombreCompleto === 'string' ? item.nombreCompleto : 'Aspirante sin nombre',
          documentosFaltantes: stringList(item.documentosFaltantes),
        }]
      })
    : []

  const categorias = stringList(faltantes.categoriasInstitucionalesFaltantes)
  return categorias.length > 0 || aspirantes.length > 0
    ? { categoriasInstitucionalesFaltantes: categorias, aspirantesConDocumentosFaltantes: aspirantes }
    : null
}
