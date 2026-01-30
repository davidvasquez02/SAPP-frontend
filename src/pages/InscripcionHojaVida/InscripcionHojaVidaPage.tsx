import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import './InscripcionHojaVidaPage.css'

const InscripcionHojaVidaPage = () => {
  const { convocatoriaId, inscripcionId } = useParams()

  return (
    <ModuleLayout title="Admisiones">
      <section className="inscripcion-hoja-vida">
        <Link
          className="inscripcion-hoja-vida__back"
          to={`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`}
        >
          ← Volver a Inscripción
        </Link>
        <h1 className="inscripcion-hoja-vida__title">Hoja de vida</h1>
        <p className="inscripcion-hoja-vida__subtitle">En construcción.</p>
      </section>
    </ModuleLayout>
  )
}

export default InscripcionHojaVidaPage
