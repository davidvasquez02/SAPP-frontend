import { DocentesPorGrupoPanel } from '../GestionProfesores/DocentesPorGrupoPanel'
import { GruposInvestigacionLayout } from './GruposInvestigacionLayout'

/**
 * Profesores asociados a cada grupo (integrantes y director). Es el unico lugar donde se gestiona: Gestion de
 * profesores solo administra el acceso (rol) de los profesores al sistema.
 */
const ProfesoresGrupoPage = () => (
  <GruposInvestigacionLayout>
    <div className="gestion-profesores">
      <DocentesPorGrupoPanel />
    </div>
  </GruposInvestigacionLayout>
)

export default ProfesoresGrupoPage
