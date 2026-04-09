import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getEstudianteById } from '../../modules/estudiantes/services/estudiantesMockService'
import type { EstudianteCoordinacion } from '../../modules/estudiantes/types'
import './EstudianteDetalleCoordinacionPage.css'

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'America/Bogota',
  }).format(date)
}

const formatEstado = (estado: EstudianteCoordinacion['estadoAcademico']) => {
  const normalized = estado.trim().toUpperCase()

  if (normalized === '1') {
    return 'activo'
  }

  return normalized.replaceAll('_', ' ').toLowerCase()
}

const EstudianteDetalleCoordinacionPage = () => {
  const { estudianteId } = useParams()
  const [estudiante, setEstudiante] = useState<EstudianteCoordinacion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = Number(estudianteId)

    if (Number.isNaN(id)) {
      setError('El estudiante solicitado no es válido.')
      setIsLoading(false)
      return
    }

    const loadEstudiante = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getEstudianteById(id)

        if (!data) {
          setError('No se encontró información para el estudiante seleccionado.')
          return
        }

        setEstudiante(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar el detalle.')
      } finally {
        setIsLoading(false)
      }
    }

    loadEstudiante()
  }, [estudianteId])

  return (
    <ModuleLayout title="Estudiantes">
      <section className="estudiante-detalle">
        <Link to="/coordinacion/estudiantes" className="estudiante-detalle__back">
          ← Volver al listado
        </Link>

        {isLoading ? <p className="estudiante-detalle__status">Cargando información...</p> : null}

        {!isLoading && error ? (
          <p className="estudiante-detalle__status estudiante-detalle__status--error">{error}</p>
        ) : null}

        {!isLoading && estudiante ? (
          <article className="estudiante-detalle__card">
            <header className="estudiante-detalle__header">
              <h1 className="estudiante-detalle__title">{estudiante.nombreCompleto}</h1>
              <p className="estudiante-detalle__subtitle">{estudiante.programaNombre}</p>
            </header>

            <div className="estudiante-detalle__grid">
              <div>
                <span className="estudiante-detalle__label">Código</span>
                <span className="estudiante-detalle__value">{estudiante.codigo}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Documento</span>
                <span className="estudiante-detalle__value">
                  {estudiante.tipoDocumento} {estudiante.numeroDocumento}
                </span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Correo institucional</span>
                <span className="estudiante-detalle__value estudiante-detalle__value--break">
                  {estudiante.correoInstitucional}
                </span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Estado académico</span>
                <span className="estudiante-detalle__value">{formatEstado(estudiante.estadoAcademico)}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Cohorte</span>
                <span className="estudiante-detalle__value">{estudiante.cohorte}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Fecha de ingreso</span>
                <span className="estudiante-detalle__value">{formatDate(estudiante.fechaIngreso)}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Promedio acumulado</span>
                <span className="estudiante-detalle__value">{estudiante.promedioAcumulado.toFixed(2)}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Créditos aprobados</span>
                <span className="estudiante-detalle__value">{estudiante.creditosAprobados}</span>
              </div>
              <div>
                <span className="estudiante-detalle__label">Créditos pendientes</span>
                <span className="estudiante-detalle__value">{estudiante.creditosPendientes}</span>
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default EstudianteDetalleCoordinacionPage
