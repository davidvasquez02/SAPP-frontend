import { Link } from 'react-router-dom'
import { canManagePosgrados } from '../../auth/roleGuards'
import { ModuleLayout } from '../../components'
import { useAuth } from '../../context/Auth'
import './MatriculaHomePage.css'

export const MatriculaHomePage = () => {
  const { session } = useAuth()
  const roles = session?.kind === 'SAPP' ? session.user.roles : []
  const coordinator = canManagePosgrados(roles)

  return <ModuleLayout title="Matrícula">
    <section className="matricula-home" aria-labelledby="matricula-home-title">
      <div><p className="matricula-home__eyebrow">Gestión de matrícula</p><h1 id="matricula-home-title">¿Qué proceso deseas consultar?</h1><p>Gestiona por separado la inscripción de asignaturas y la liquidación financiera de posgrados.</p></div>
      <div className="matricula-home__options">
        <Link to="/matricula/academica" className="matricula-home__card"><span aria-hidden="true">📚</span><span><strong>Matrícula académica</strong><small>{coordinator ? 'Asignaturas, documentos y seguimiento del periodo.' : 'Registra asignaturas y documentos requeridos para el proceso de matrícula.'}</small></span><span aria-hidden="true">→</span></Link>
        <Link to="/matricula/financiera" className="matricula-home__card"><span aria-hidden="true">💳</span><span><strong>{coordinator ? 'Matrícula financiera' : 'Liquidación'}</strong><small>{coordinator ? 'Liquidaciones, respuestas, alertas y publicación.' : 'Información para proceso de liquidación.'}</small></span><span aria-hidden="true">→</span></Link>
      </div>
    </section>
  </ModuleLayout>
}
