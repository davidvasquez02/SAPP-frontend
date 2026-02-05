import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getInscripcionesByConvocatoria } from '../../modules/admisiones/api/inscripcionAdmisionService'
import type { InscripcionAdmisionDto } from '../../modules/admisiones/api/types'
import StudentCard from '../../modules/admisiones/components/StudentCard/StudentCard'
import { getMockStudentPhotoUrl } from '../../modules/admisiones/utils/mockStudentPhoto'
import './ConvocatoriaDetallePage.css'

const ConvocatoriaDetallePage = () => {
  const { convocatoriaId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [inscripciones, setInscripciones] = useState<InscripcionAdmisionDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { periodoAcademico } = useMemo(() => {
    return (location.state as { periodoAcademico?: string } | null) ?? {}
  }, [location.state])

  const periodoConvocatoria =
    periodoAcademico ?? inscripciones[0]?.periodoAcademico ?? null
  const pageTitle = periodoConvocatoria
    ? `Convocatoria - ${periodoConvocatoria}`
    : 'Convocatoria'

  const loadInscripciones = useCallback(async () => {
    if (!convocatoriaId) {
      setError('Convocatoria inválida.')
      return
    }

    const convocatoriaIdNumber = Number(convocatoriaId)

    if (Number.isNaN(convocatoriaIdNumber)) {
      setError('Convocatoria inválida.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getInscripcionesByConvocatoria(convocatoriaIdNumber)
      setInscripciones(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No fue posible cargar las inscripciones.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [convocatoriaId])

  useEffect(() => {
    if (!convocatoriaId) {
      setError('Convocatoria inválida.')
      return
    }

    const convocatoriaIdNumber = Number(convocatoriaId)

    if (Number.isNaN(convocatoriaIdNumber)) {
      setError('Convocatoria inválida.')
      return
    }

    loadInscripciones()
  }, [convocatoriaId, loadInscripciones])

  const handleRowClick = (inscripcion: InscripcionAdmisionDto) => {
    if (!convocatoriaId) {
      return
    }

    navigate(
      `/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcion.id}`,
      {
        state: {
          nombreAspirante: inscripcion.nombreAspirante,
          periodoAcademico: inscripcion.periodoAcademico,
          inscripcionId: inscripcion.id,
        },
      }
    )
  }

  return (
    <ModuleLayout title="Admisiones">
      <section className="convocatoria-detalle">
        <Link className="convocatoria-detalle__back" to="/admisiones">
          ← Volver
        </Link>

        <h1 className="convocatoria-detalle__title">{pageTitle}</h1>

        {isLoading ? (
          <div className="convocatoria-detalle__skeletons" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="convocatoria-detalle__skeleton" />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="convocatoria-detalle__status convocatoria-detalle__status--error">
            <p>{error}</p>
            <button
              className="convocatoria-detalle__retry"
              type="button"
              onClick={loadInscripciones}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && inscripciones.length === 0 ? (
          <p className="convocatoria-detalle__status">
            No hay inscripciones para esta convocatoria.
          </p>
        ) : null}

        {!isLoading && !error && inscripciones.length > 0 ? (
          <div className="convocatoria-detalle__grid">
            {inscripciones.map((inscripcion) => (
              <StudentCard
                key={inscripcion.id}
                inscripcion={inscripcion}
                photoUrl={getMockStudentPhotoUrl(
                  inscripcion.aspiranteId,
                  inscripcion.nombreAspirante
                )}
                onClick={() => handleRowClick(inscripcion)}
              />
            ))}
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default ConvocatoriaDetallePage
