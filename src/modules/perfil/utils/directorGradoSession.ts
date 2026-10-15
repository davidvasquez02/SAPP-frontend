import type { AuthSession } from '../../../context/Auth/types'
import type { DirectorGradoPerfil } from '../services/directorGradoPerfilService'

export const actualizarDirectorEnSession = (
  session: AuthSession | null,
  asignacion: DirectorGradoPerfil,
): AuthSession | null => {
  if (!session || session.user.estudiante?.id !== asignacion.estudianteId) return session
  const estudiante = {
    ...session.user.estudiante,
    directorTg: asignacion.director,
    grupoInvestigacion: asignacion.grupo,
  }
  return {
    ...session,
    user: {
      ...session.user,
      estudiante,
      detalle: { ...session.user.detalle, estudiante },
    },
  }
}
