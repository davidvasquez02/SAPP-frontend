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
