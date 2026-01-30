import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import './InscripcionEntrevistasPage.css'

const InscripcionEntrevistasPage = () => {
  const { convocatoriaId, inscripcionId } = useParams()

  return (
    <ModuleLayout title="Admisiones">
      <section className="inscripcion-entrevistas">
        <Link
          className="inscripcion-entrevistas__back"
          to={`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`}
        >
          ← Volver a Inscripción
        </Link>
        <h1 className="inscripcion-entrevistas__title">Entrevistas</h1>
        <p className="inscripcion-entrevistas__subtitle">En construcción.</p>
      </section>
    </ModuleLayout>
  )
}

export default InscripcionEntrevistasPage
