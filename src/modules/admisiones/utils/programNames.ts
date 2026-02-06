const PROGRAMAS_LARGOS = new Map<number, string>([
  [1, 'Maestría en Ingeniería de Sistemas e Informática'],
  [2, 'Doctorado en Ciencias de la Computación'],
])

export const getProgramaNombreLargo = (programaId: number, fallback: string): string => {
  return PROGRAMAS_LARGOS.get(programaId) ?? fallback
}
