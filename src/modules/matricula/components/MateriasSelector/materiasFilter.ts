import type { MateriaDto } from '../../types'

export type NivelMateriaFilter = number | null

export const getNivelesMaterias = (materias: MateriaDto[]): number[] =>
  [...new Set(materias.flatMap((materia) => (materia.nivel == null ? [] : [materia.nivel])))].sort(
    (first, second) => first - second,
  )

export const filterMaterias = (
  materias: MateriaDto[],
  selectedIds: ReadonlySet<number>,
  query: string,
  nivel: NivelMateriaFilter,
): MateriaDto[] => {
  const term = query.trim().toLowerCase()

  return materias
    .filter((materia) => {
      if (selectedIds.has(materia.id)) {
        return false
      }

      // Las electivas no tienen nivel y deben permanecer disponibles con cualquier filtro.
      if (nivel !== null && materia.nivel !== null && materia.nivel !== nivel) {
        return false
      }

      if (!term) {
        return true
      }

      const codigo = materia.codigo?.toLowerCase() ?? ''
      return materia.nombre.toLowerCase().includes(term) || codigo.includes(term)
    })
    .sort((first, second) => Number(first.nivel == null) - Number(second.nivel == null))
}
