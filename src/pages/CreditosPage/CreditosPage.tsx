import { ModuleLayout } from '../../components/ModuleLayout'
import './CreditosPage.css'

const CreditosPage = () => {
  return (
    <ModuleLayout title="Créditos">
      <section className="creditos-page">
        <h3>Créditos condonables</h3>
        <p>
          Gestiona tus solicitudes de crédito, certificaciones de contraprestación y estados de
          aprobación.
        </p>
      </section>
    </ModuleLayout>
  )
}

export default CreditosPage
