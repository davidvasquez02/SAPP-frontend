import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import './InscripcionExamenPage.css'

const InscripcionExamenPage = () => {
  const { convocatoriaId, inscripcionId } = useParams()

  return (
    <ModuleLayout title="Admisiones">
      <section className="inscripcion-examen">
        <Link
          className="inscripcion-examen__back"
          to={`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`}
        >
          ← Volver a Inscripción
        </Link>
        <h1 className="inscripcion-examen__title">Examen de conocimiento</h1>
        <p className="inscripcion-examen__subtitle">En construcción.</p>
      </section>
    </ModuleLayout>
  )
}

export default InscripcionExamenPage
