import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { useAuth } from '../../context/Auth'
import type { AuthUser } from '../../context/Auth/types'
import {
  getAsignacionesByProfesorKey,
  type AsignacionEntrevista,
} from '../../modules/admisiones/mock/profesorAsignaciones.mock'
import './AdmisionesMisEntrevistasPage.css'

const AdmisionesMisEntrevistasPage = () => {
  const { session } = useAuth()
  const navigate = useNavigate()

  const asignaciones = useMemo<AsignacionEntrevista[]>(() => {
    if (!session || session.kind !== 'SAPP') {
      return []
    }

    const { id, username } = session.user as AuthUser

    return getAsignacionesByProfesorKey({
      userId: id,
      username,
    })
  }, [session])

  return (
    <ModuleLayout title="Admisiones">
      <section className="admisiones-mis-entrevistas">
        <header className="admisiones-mis-entrevistas__header">
          <h1 className="admisiones-mis-entrevistas__title">Mis entrevistas</h1>
          <p className="admisiones-mis-entrevistas__subtitle">
            Listado de aspirantes asignados para calificación de entrevista.
          </p>
        </header>

        {asignaciones.length === 0 ? (
          <p className="admisiones-mis-entrevistas__status">
            No tienes inscripciones asignadas actualmente.
          </p>
        ) : (
          <div className="admisiones-mis-entrevistas__table-wrapper sapp-table-shell">
            <table className="admisiones-mis-entrevistas__table sapp-table">
              <thead>
                <tr>
                  <th>Aspirante</th>
                  <th>Programa</th>
                  <th>Periodo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((asignacion) => (
                  <tr key={`${asignacion.convocatoriaId}-${asignacion.inscripcionId}`}>
                    <td>{asignacion.nombreAspirante}</td>
                    <td>{asignacion.programa}</td>
                    <td>{asignacion.periodo}</td>
                    <td>
                      <button
                        type="button"
                        className="admisiones-mis-entrevistas__action"
                        onClick={() => {
                          navigate(
                            `/admisiones/convocatoria/${asignacion.convocatoriaId}/inscripcion/${asignacion.inscripcionId}/entrevistas`,
                            {
                              state: {
                                nombreAspirante: asignacion.nombreAspirante,
                              },
                            },
                          )
                        }}
                      >
                        Calificar entrevista
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ModuleLayout>
  )
}

export default AdmisionesMisEntrevistasPage
