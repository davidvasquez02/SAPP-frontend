import type { AspiranteConsultaInfoDto } from './aspiranteConsultaTypes'
import type { AuthSession } from '../context/Auth/types'

export const mapAspiranteInfoToSession = (dto: AspiranteConsultaInfoDto): AuthSession => ({
  kind: 'ASPIRANTE',
  accessToken: 'NO_TOKEN',
  user: {
    id: dto.id,
    roles: ['ASPIRANTE'],
    numeroInscripcionUis: dto.numeroInscripcionUis,
    tipoDocumentoIdentificacion: dto.tipoDocumentoIdentificacion,
    numeroDocumento: dto.numeroDocumento,
    emailPersonal: dto.emailPersonal ?? undefined,
    fechaRegistro: dto.fechaRegistro ?? undefined,
    observaciones: dto.observaciones ?? null,
    inscripcionAdmisionId: dto.inscripcionAdmisionId ?? null,
  },
})
