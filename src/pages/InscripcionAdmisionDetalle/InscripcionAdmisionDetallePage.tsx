import { Link, useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import './InscripcionAdmisionDetallePage.css'

const InscripcionAdmisionDetallePage = () => {
  const { convocatoriaId, inscripcionId } = useParams()
  const navigate = useNavigate()

  const handleNavigate = (path: string) => {
    if (!convocatoriaId || !inscripcionId) {
      return
    }

    navigate(`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}/${path}`)
  }

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
        <p className="inscripcion-detalle__subtitle">Seleccione una opción</p>

        <div className="inscripcion-detalle__options">
          <button
            className="inscripcion-detalle__card"
            type="button"
            onClick={() => handleNavigate('documentos')}
          >
            Documentos cargados
          </button>
          <button
            className="inscripcion-detalle__card"
            type="button"
            onClick={() => handleNavigate('hoja-vida')}
          >
            Hoja de vida
          </button>
          <button
            className="inscripcion-detalle__card"
            type="button"
            onClick={() => handleNavigate('examen')}
          >
            Examen de conocimiento
          </button>
          <button
            className="inscripcion-detalle__card"
            type="button"
            onClick={() => handleNavigate('entrevistas')}
          >
            Entrevistas
          </button>
        </div>
      </section>
    </ModuleLayout>
  )
}

export default InscripcionAdmisionDetallePage
