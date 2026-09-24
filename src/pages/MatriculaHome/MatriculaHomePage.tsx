import { Link } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import './MatriculaHomePage.css'

export const MatriculaHomePage = () => <ModuleLayout title="Matrícula">
  <section className="matricula-home" aria-labelledby="matricula-home-title">
    <div><p className="matricula-home__eyebrow">Gestión de matrícula</p><h1 id="matricula-home-title">¿Qué proceso deseas consultar?</h1><p>Gestiona por separado la inscripción de asignaturas y la liquidación financiera de posgrados.</p></div>
    <div className="matricula-home__options">
      <Link to="/matricula/academica" className="matricula-home__card"><span aria-hidden="true">📚</span><span><strong>Matrícula académica</strong><small>Asignaturas, documentos y seguimiento del periodo.</small></span><span aria-hidden="true">→</span></Link>
      <Link to="/matricula/financiera" className="matricula-home__card"><span aria-hidden="true">💳</span><span><strong>Matrícula financiera</strong><small>Liquidaciones, respuestas, alertas y publicación.</small></span><span aria-hidden="true">→</span></Link>
    </div>
  </section>
</ModuleLayout>
