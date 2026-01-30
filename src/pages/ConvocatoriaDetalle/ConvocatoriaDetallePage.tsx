import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getInscripcionesByConvocatoria } from '../../modules/admisiones/api/inscripcionAdmisionService'
import type { InscripcionAdmisionDto } from '../../modules/admisiones/api/types'
import './ConvocatoriaDetallePage.css'

const ConvocatoriaDetallePage = () => {
  const { convocatoriaId } = useParams()
  const navigate = useNavigate()
  const [inscripciones, setInscripciones] = useState<InscripcionAdmisionDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    let isMounted = true

    const loadInscripciones = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getInscripcionesByConvocatoria(convocatoriaIdNumber)
        if (isMounted) {
          setInscripciones(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No fue posible cargar las inscripciones.'
        if (isMounted) {
          setError(message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInscripciones()

    return () => {
      isMounted = false
    }
  }, [convocatoriaId])

  const handleRowClick = (inscripcionId: number) => {
    if (!convocatoriaId) {
      return
    }

    navigate(`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`)
  }

  return (
    <ModuleLayout title="Admisiones">
      <section className="convocatoria-detalle">
        <Link className="convocatoria-detalle__back" to="/admisiones">
          ← Volver
        </Link>

        <h1 className="convocatoria-detalle__title">Convocatoria {convocatoriaId}</h1>

        {isLoading ? (
          <p className="convocatoria-detalle__status">Cargando estudiantes…</p>
        ) : null}

        {error ? (
          <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && inscripciones.length === 0 ? (
          <p className="convocatoria-detalle__status">
            No hay aspirantes registrados para esta convocatoria.
          </p>
        ) : null}

        {!isLoading && !error && inscripciones.length > 0 ? (
          <div className="convocatoria-detalle__table-wrapper">
            <table className="convocatoria-detalle__table">
              <thead>
                <tr>
                  <th>Nombre aspirante</th>
                  <th>Estado</th>
                  <th>Fecha inscripción</th>
                  <th>Periodo académico</th>
                  <th>Programa académico</th>
                  <th>Puntaje total</th>
                </tr>
              </thead>
              <tbody>
                {inscripciones.map((inscripcion) => (
                  <tr
                    key={inscripcion.id}
                    className="convocatoria-detalle__row"
                    onClick={() => handleRowClick(inscripcion.id)}
                  >
                    <td>{inscripcion.nombreAspirante}</td>
                    <td>{inscripcion.estado}</td>
                    <td>{inscripcion.fechaInscripcion}</td>
                    <td>{inscripcion.periodoAcademico}</td>
                    <td>{inscripcion.programaAcademico}</td>
                    <td>{inscripcion.puntajeTotal ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default ConvocatoriaDetallePage
