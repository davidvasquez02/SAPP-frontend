import { ModuleLayout } from '../../components/ModuleLayout'
import './MatriculaPage.css'

const MatriculaPage = () => {
  return (
    <ModuleLayout title="Matrícula">
      <section className="matricula-page">
        <h3>Matrícula académica</h3>
        <p>
          Consulta tu matrícula por periodo, asignaturas inscritas y el estado de las liquidaciones
          académicas.
        </p>
      </section>
    </ModuleLayout>
  )
}

export default MatriculaPage
