import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import './InscripcionDocumentosPage.css'

const InscripcionDocumentosPage = () => {
  const { convocatoriaId, inscripcionId } = useParams()

  return (
    <ModuleLayout title="Admisiones">
      <section className="inscripcion-documentos">
        <Link
          className="inscripcion-documentos__back"
          to={`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`}
        >
          ← Volver a Inscripción
        </Link>
        <h1 className="inscripcion-documentos__title">Documentos cargados</h1>
        <p className="inscripcion-documentos__subtitle">En construcción.</p>
      </section>
    </ModuleLayout>
  )
}

export default InscripcionDocumentosPage
