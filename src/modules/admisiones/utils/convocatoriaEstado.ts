import type { ConvocatoriaAdmisionDto } from '../api/convocatoriaAdmisionTypes'

export const isConvocatoriaVigente = (
  convocatoria: Pick<ConvocatoriaAdmisionDto, 'vigente'>
): boolean => convocatoria.vigente
