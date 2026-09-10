import type { EvaluacionAdmisionItem } from '../types/evaluacionAdmisionTypes'

const SIN_EVALUADOR_LABEL = 'Sin evaluador'
const FALLBACK_PONDERACION = 999999

const normalizeEvaluador = (evaluador: string | null | undefined): string =>
  (evaluador ?? '').trim().replace(/\s+/g, ' ')

const compareCodes = (a: string, b: string): number =>
  a.localeCompare(b, 'es', { sensitivity: 'base' })

export type EvaluadorGroup = {
  evaluadorKey: string
  evaluadorLabel: string
  items: EvaluacionAdmisionItem[]
}

export const groupByEvaluador = (
  items: EvaluacionAdmisionItem[],
): EvaluadorGroup[] => {
  const groups = new Map<string, EvaluadorGroup>()

  items.forEach((item) => {
    const normalized = normalizeEvaluador(item.evaluador)
    const evaluadorLabel = normalized === '' ? SIN_EVALUADOR_LABEL : normalized
    const evaluadorKey = normalized === '' ? SIN_EVALUADOR_LABEL : normalized
    const existing = groups.get(evaluadorKey)

    if (existing) {
      existing.items.push(item)
      return
    }

    groups.set(evaluadorKey, {
      evaluadorKey,
      evaluadorLabel,
      items: [item],
    })
  })

  const sortedGroups = Array.from(groups.values()).map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => {
      const ponderacionA = a.ponderacionId ?? FALLBACK_PONDERACION
      const ponderacionB = b.ponderacionId ?? FALLBACK_PONDERACION

      if (ponderacionA !== ponderacionB) {
        return ponderacionA - ponderacionB
      }

      return compareCodes(a.codigo, b.codigo)
    }),
  }))

  return sortedGroups.sort((a, b) => {
    const aIsSinEvaluador = a.evaluadorLabel === SIN_EVALUADOR_LABEL
    const bIsSinEvaluador = b.evaluadorLabel === SIN_EVALUADOR_LABEL

    if (aIsSinEvaluador && bIsSinEvaluador) {
      return 0
    }

    if (aIsSinEvaluador) {
      return 1
    }

    if (bIsSinEvaluador) {
      return -1
    }

    return a.evaluadorLabel.localeCompare(b.evaluadorLabel, 'es', { sensitivity: 'base' })
  })
}
