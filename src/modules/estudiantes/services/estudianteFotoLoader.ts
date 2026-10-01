import { getInscripcionesByAspirantes } from '../../admisiones/api/inscripcionAdmisionService'
import { getFotosDocumentoByTramitesBulk } from '../../documentos/api/documentoFotoService'
import { getFotoCacheada, setFotoCacheada } from './estudianteFotoCache'
import type { EstudianteCoordinacion } from '../types'

const CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE = 1002
const CODIGO_TIPO_DOCUMENTO_FOTO_ASPIRANTE = 'ANX-4'

/**
 * Resuelve las fotos (ANX-4) de un grupo de estudiantes en 2 llamadas en total (una de
 * inscripciones, otra de fotos), en vez de 2 por estudiante: evitaba el 429 del gateway con
 * programas de varios estudiantes. Un fallo en el lote deja los placeholders sin romper el listado.
 *
 * Los estudiantes que ya tienen foto cacheada (ver estudianteFotoCache) no se vuelven a pedir.
 * Cada foto resuelta se cachea de inmediato, sin importar quien llamo esta funcion: tanto el
 * listado de coordinacion como el prefetch al iniciar sesion la usan por igual.
 */
export const cargarFotosDeEstudiantes = async (
  estudiantes: (EstudianteCoordinacion & { idAspirante: number })[],
): Promise<Map<number, string>> => {
  const fotosPorEstudianteId = new Map<number, string>()
  const pendientes = estudiantes.filter((estudiante) => !getFotoCacheada(estudiante.id))

  if (pendientes.length === 0) {
    return fotosPorEstudianteId
  }

  try {
    const inscripcionesPorAspiranteId = await getInscripcionesByAspirantes(
      pendientes.map((estudiante) => estudiante.idAspirante),
    )

    const tramiteIdPorEstudianteId = new Map<number, number>()
    pendientes.forEach((estudiante) => {
      const inscripcion = inscripcionesPorAspiranteId.get(estudiante.idAspirante)
      if (inscripcion) {
        tramiteIdPorEstudianteId.set(estudiante.id, inscripcion.id)
      }
    })

    if (tramiteIdPorEstudianteId.size === 0) {
      return fotosPorEstudianteId
    }

    const fotosPorTramiteId = await getFotosDocumentoByTramitesBulk({
      codigoTipoTramite: CODIGO_TIPO_TRAMITE_ADMISION_ASPIRANTE,
      codigoTipoDocumentoTramite: CODIGO_TIPO_DOCUMENTO_FOTO_ASPIRANTE,
      tramiteIds: [...tramiteIdPorEstudianteId.values()],
    })

    tramiteIdPorEstudianteId.forEach((tramiteId, estudianteId) => {
      const fotoUrl = fotosPorTramiteId.get(tramiteId)
      if (fotoUrl) {
        setFotoCacheada(estudianteId, fotoUrl)
        fotosPorEstudianteId.set(estudianteId, fotoUrl)
      }
    })
  } catch {
    // Un fallo del lote conserva los placeholders sin afectar el listado.
  }

  return fotosPorEstudianteId
}

/** Para el prefetch: filtra a los que tienen aspirante antes de pedir sus fotos. */
export const cargarFotosDeEstudiantesConAspirante = async (
  estudiantes: EstudianteCoordinacion[],
): Promise<Map<number, string>> => {
  const conAspirante = estudiantes.filter(
    (estudiante): estudiante is EstudianteCoordinacion & { idAspirante: number } =>
      estudiante.idAspirante !== null,
  )
  return cargarFotosDeEstudiantes(conAspirante)
}
