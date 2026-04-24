import type { AspiranteConsultaInfoDto } from './aspiranteConsultaTypes'
import type { AuthSession } from '../context/Auth/types'

export const mapAspiranteInfoToSession = (dto: AspiranteConsultaInfoDto): AuthSession => {
  const numeroInscripcionUisStr = String(dto.numeroInscripcionUis)

  return {
    kind: 'ASPIRANTE',
    accessToken: 'NO_TOKEN',
    user: {
      id: dto.id,
      roles: ['ASPIRANTE'],
      numeroInscripcionUis: numeroInscripcionUisStr,
      tipoDocumentoIdentificacion: dto.tipoDocumentoIdentificacion,
      numeroDocumento: dto.numeroDocumento,
      emailPersonal: dto.emailPersonal ?? undefined,
      fechaRegistro: dto.fechaRegistro ?? undefined,
      observaciones: dto.observaciones ?? null,
      inscripcionAdmisionId: dto.inscripcionAdmisionId ?? null,
      nombre: dto.nombre ?? undefined,
      director: dto.director ?? undefined,
      grupoInvestigacion: dto.grupoInvestigacion ?? undefined,
      telefono: dto.telefono ?? undefined,
    },
  }
}
