import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import './InscripcionAdmisionDetallePage.css'

const InscripcionAdmisionDetallePage = () => {
  const { convocatoriaId, inscripcionId } = useParams()

  return (
    <ModuleLayout title="Admisiones">
      <section className="inscripcion-detalle">
        <Link
          className="inscripcion-detalle__back"
          to={`/admisiones/convocatoria/${convocatoriaId}`}
        >
          ← Volver a Convocatoria
        </Link>

        <h1 className="inscripcion-detalle__title">Inscripción {inscripcionId}</h1>
        <p className="inscripcion-detalle__subtitle">Detalle de aspirante en construcción.</p>
      </section>
    </ModuleLayout>
  )
}

export default InscripcionAdmisionDetallePage
