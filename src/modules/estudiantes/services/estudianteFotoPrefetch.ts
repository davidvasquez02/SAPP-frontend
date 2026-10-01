import { cargarFotosDeEstudiantesConAspirante } from './estudianteFotoLoader'
import { getEstudiantesByPrograma, getProgramasCoordinacion } from './estudiantesMockService'
import { resolveTipoPrograma } from '../../../shared/domain/programaAcademico'

/**
 * Adelanta la carga de fotos de los estudiantes activos (doctorado y maestria, sin egresados)
 * apenas inicia sesion un coordinador/admin/secretaria, para que al entrar al modulo de
 * Estudiantes ya esten en la cache (ver estudianteFotoCache) y no haya que esperar los ~10s
 * del lote. Fire-and-forget: nunca bloquea el login ni muestra error alguno, el modulo sigue
 * funcionando igual (pide lo que falte) si esto no llego a terminar o fallo.
 */
export const prefetchFotosEstudiantesActivos = async (): Promise<void> => {
  try {
    const programas = await getProgramasCoordinacion()
    const programasDePosgrado = programas.filter((programa) => resolveTipoPrograma({
      id: programa.id,
      nombre: programa.nombre,
      codigoUis: programa.codigo,
    }) !== null)

    await Promise.all(
      programasDePosgrado.map(async (programa) => {
        const estudiantes = await getEstudiantesByPrograma(programa.id)
        await cargarFotosDeEstudiantesConAspirante(estudiantes)
      }),
    )
  } catch {
    // Best-effort: un fallo aca no debe afectar el login ni mostrarse al usuario.
  }
}
