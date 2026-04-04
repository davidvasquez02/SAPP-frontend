import { TIPO_TRAMITE_ADMISIONES } from '../api/constants'
import { createPeriodoAcademicoFecha, getPeriodosAcademicos } from '../api/periodoAcademicoService'
import { buildAnioPeriodoLabel } from '../utils/periodoLabel'

export type EnsurePeriodoResult = {
  periodoId: number
  existed: boolean
  label: string
  createdFecha?: boolean
}

const normalizeLabel = (label: string): string => label.trim().replace(/\s+/g, ' ')

export async function ensurePeriodoForAdmision(params: {
  anio: number
  semestre: 1 | 2
  fechaInicioDefault: string
  fechaFinDefault: string
  descripcion: string
}): Promise<EnsurePeriodoResult> {
  const { anio, semestre, fechaInicioDefault, fechaFinDefault, descripcion } = params
  const label = buildAnioPeriodoLabel(anio, semestre)
  const normalizedTarget = normalizeLabel(label)
  const periodos = await getPeriodosAcademicos()

  const existing = periodos.find((periodo) => normalizeLabel(periodo.anioPeriodo) === normalizedTarget)
  if (existing) {
    return {
      periodoId: existing.id,
      existed: true,
      label,
    }
  }

  const newId = periodos.length === 0 ? 1 : Math.max(...periodos.map((periodo) => periodo.id)) + 1

  try {
    await createPeriodoAcademicoFecha({
      periodoId: newId,
      tipoTramiteId: TIPO_TRAMITE_ADMISIONES,
      fechaInicio: fechaInicioDefault,
      fechaFin: fechaFinDefault,
      descripcion,
    })
  } catch (error) {
    const backendMessage = error instanceof Error ? ` ${error.message}` : ''
    throw new Error(
      `No se pudo crear el periodo (periodoId = ${newId}). Confirma soporte backend para creación automática del periodoId.${backendMessage}`
    )
  }

  return {
    periodoId: newId,
    existed: false,
    label,
    createdFecha: true,
  }
}
