import { DocentesPorGrupoPanel } from '../GestionProfesores/DocentesPorGrupoPanel'
import { GruposInvestigacionLayout } from './GruposInvestigacionLayout'

/**
 * Profesores asociados a cada grupo. Usa el mismo panel que Gestion de profesores, para que
 * ambas pantallas muestren y cambien los mismos datos.
 */
const ProfesoresGrupoPage = () => (
  <GruposInvestigacionLayout>
    <div className="gestion-profesores">
      <DocentesPorGrupoPanel />
    </div>
  </GruposInvestigacionLayout>
)

export default ProfesoresGrupoPage
