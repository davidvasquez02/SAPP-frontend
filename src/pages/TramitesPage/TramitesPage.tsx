import { ModuleLayout } from '../../components/ModuleLayout'
import './TramitesPage.css'

const TramitesPage = () => {
  return (
    <ModuleLayout title="Trámites">
      <section className="tramites-page">
        <h3>Gestión de trámites estudiantiles</h3>
        <p>
          Aquí podrás consultar, crear y dar seguimiento a solicitudes académicas, documentos y
          procesos internos del posgrado.
        </p>
      </section>
    </ModuleLayout>
  )
}

export default TramitesPage
