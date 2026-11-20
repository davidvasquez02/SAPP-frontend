export type NivelPrograma = 'MAESTRIA' | 'DOCTORADO'

export interface ProgramaAcademicoCatalogo {
  id: number
  nombre: string
  nivel?: NivelPrograma | string | null
  codigoUis?: string | null
  codigo_uis?: string | null
  codigoIdp?: string | null
  codigo_idp?: string | null
  codigoNombre?: string | null
}

export const PROGRAMAS_ACADEMICOS = {
  maestria: {
    id: 1,
    nombre: 'MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA',
    nivel: 'MAESTRIA',
    codigoUis: '302',
  },
  doctorado: {
    id: 2,
    nombre: 'DOCTORADO EN CIENCIAS DE LA COMPUTACION',
    nivel: 'DOCTORADO',
    codigoUis: '347',
  },
} as const

export type TipoProgramaAcademico = keyof typeof PROGRAMAS_ACADEMICOS

const normalize = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

/** Resuelve el programa con los campos vigentes y tolera las siglas históricas. */
export const resolveTipoPrograma = (
  programa: Partial<ProgramaAcademicoCatalogo> | string | null | undefined,
): TipoProgramaAcademico | null => {
  if (!programa) return null

  if (typeof programa !== 'string') {
    if (programa.id === PROGRAMAS_ACADEMICOS.maestria.id) return 'maestria'
    if (programa.id === PROGRAMAS_ACADEMICOS.doctorado.id) return 'doctorado'
    if (normalize(programa.nivel) === 'MAESTRIA') return 'maestria'
    if (normalize(programa.nivel) === 'DOCTORADO') return 'doctorado'

    const codigo = programa.codigoUis ?? programa.codigo_uis
    if (codigo === PROGRAMAS_ACADEMICOS.maestria.codigoUis) return 'maestria'
    if (codigo === PROGRAMAS_ACADEMICOS.doctorado.codigoUis) return 'doctorado'

    return resolveTipoPrograma(
      [programa.nombre, programa.codigoNombre, programa.codigoIdp, programa.codigo_idp]
        .filter(Boolean)
        .join(' '),
    )
  }

  const value = normalize(programa)
  if (value.includes('MAESTRIA') || /\bMISI\b/.test(value) || /\b302\b/.test(value)) {
    return 'maestria'
  }
  if (value.includes('DOCTORADO') || /\bDCC\b/.test(value) || /\b347\b/.test(value)) {
    return 'doctorado'
  }
  return null
}

export const getProgramaAcademico = (
  programa: Partial<ProgramaAcademicoCatalogo> | string | null | undefined,
) => {
  const tipo = resolveTipoPrograma(programa)
  return tipo ? PROGRAMAS_ACADEMICOS[tipo] : null
}

export const formatProgramaAcademico = (
  programa: Partial<ProgramaAcademicoCatalogo> | string,
): string => {
  const canonical = getProgramaAcademico(programa)
  if (canonical) return `${canonical.codigoUis} - ${canonical.nombre}`
  return typeof programa === 'string' ? programa.trim() : programa.nombre.trim()
}

const CON_CODIGO = /^\s*\d+\s*-\s*\S/
const NOMBRE_POR_SIGLA: Record<string, string> = {
  MISI: 'Maestría en Ingeniería de Sistemas e Informática',
  DCC: 'Doctorado en Ciencias de la Computación',
}

/**
 * Cómo se muestra un programa académico en todo el sistema: "302 - Maestría en…". Si el texto ya trae el código (lo
 * normal cuando viene del servidor) se deja tal cual; si no, se le antepone el código del programa. Acepta el texto
 * del programa o un objeto con id/nombre/código.
 */
export const etiquetaPrograma = (
  programa: Partial<ProgramaAcademicoCatalogo> | string | null | undefined,
): string => {
  if (!programa) return ''

  const texto = (typeof programa === 'string' ? programa : programa.codigoNombre || programa.nombre || '').trim()
  if (CON_CODIGO.test(texto)) return texto

  if (typeof programa !== 'string') {
    const codigo = (programa.codigoUis ?? programa.codigo_uis)?.trim()
    if (codigo && texto) return `${codigo} - ${texto}`
  }

  const canonico = getProgramaAcademico(programa)
  if (!canonico) return texto
  // un texto que es solo la sigla histórica (MISI, DCC) se muestra con el nombre completo del programa
  return `${canonico.codigoUis} - ${NOMBRE_POR_SIGLA[texto.toUpperCase()] ?? (texto || canonico.nombre)}`
}
