import { HttpError } from '../../../shared/http/httpClient'

export interface PersonaConDocumentosFaltantes {
  id: number
  documento: string
  nombreCompleto: string
  documentosFaltantes: string[]
}

export interface FaltantesReporte {
  categoriasInstitucionalesFaltantes: string[]
  personasConDocumentosFaltantes: PersonaConDocumentosFaltantes[]
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
  const personas = [
    ...(Array.isArray(faltantes.aspirantesConDocumentosFaltantes) ? faltantes.aspirantesConDocumentosFaltantes : []),
    ...(Array.isArray(faltantes.estudiantesConDocumentosFaltantes) ? faltantes.estudiantesConDocumentosFaltantes : []),
  ].flatMap((item) => {
        if (!isRecord(item)) return []
        const id = Number(item.inscripcionId ?? item.matriculaId)
        if (!Number.isFinite(id)) return []
        return [{
          id,
          documento: typeof item.documento === 'string' ? item.documento : '',
          nombreCompleto: typeof item.nombreCompleto === 'string' ? item.nombreCompleto : 'Persona sin nombre',
          documentosFaltantes: stringList(item.documentosFaltantes),
        }]
      })

  const categorias = stringList(faltantes.categoriasInstitucionalesFaltantes)
  return categorias.length > 0 || personas.length > 0
    ? { categoriasInstitucionalesFaltantes: categorias, personasConDocumentosFaltantes: personas }
    : null
}
