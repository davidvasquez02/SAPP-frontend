import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import ProgramTypeToggle, { type ProgramType } from '../../modules/estudiantes/components/ProgramTypeToggle/ProgramTypeToggle'
import StudentHorizontalBoard from '../../modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard'
import {
  getEstudiantesByPrograma,
  getProgramasCoordinacion,
} from '../../modules/estudiantes/services/estudiantesMockService'
import type { EstudianteCoordinacion, ProgramaCoordinacion } from '../../modules/estudiantes/types'
import './EstudiantesCoordinacionPage.css'

const getProgramaType = (programa: ProgramaCoordinacion): ProgramType | null => {
  const nombre = programa.nombre.trim().toLowerCase()
  const codigo = programa.codigo.trim().toLowerCase()

  if (nombre.includes('maestr') || codigo.includes('misi')) {
    return 'maestria'
  }

  if (nombre.includes('doctor') || codigo.includes('dcc')) {
    return 'doctorado'
  }

  return null
}

const EstudiantesCoordinacionPage = () => {
  const navigate = useNavigate()
  const [programas, setProgramas] = useState<ProgramaCoordinacion[]>([])
  const [programTypeSeleccionado, setProgramTypeSeleccionado] = useState<ProgramType>('doctorado')
  const [estudiantes, setEstudiantes] = useState<EstudianteCoordinacion[]>([])
  const [isLoadingProgramas, setIsLoadingProgramas] = useState(true)
  const [isLoadingEstudiantes, setIsLoadingEstudiantes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProgramas = async () => {
      setIsLoadingProgramas(true)
      setError(null)

      try {
        const data = await getProgramasCoordinacion()
        setProgramas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar los programas.')
      } finally {
        setIsLoadingProgramas(false)
      }
    }

    loadProgramas()
  }, [])

  const programaSeleccionado = useMemo(
    () => programas.find((programa) => getProgramaType(programa) === programTypeSeleccionado) ?? null,
    [programTypeSeleccionado, programas]
  )

  useEffect(() => {
    if (!programaSeleccionado) {
      setEstudiantes([])
      return
    }

    const loadEstudiantes = async () => {
      setIsLoadingEstudiantes(true)
      setError(null)

      try {
        const data = await getEstudiantesByPrograma(programaSeleccionado.id)
        setEstudiantes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar los estudiantes.')
      } finally {
        setIsLoadingEstudiantes(false)
      }
    }

    loadEstudiantes()
  }, [programaSeleccionado])

  const isEmptyStateVisible =
    !isLoadingProgramas && !isLoadingEstudiantes && !error && (!programaSeleccionado || estudiantes.length === 0)

  return (
    <ModuleLayout title="Estudiantes">
      <section className="estudiantes-coordinacion">
        <header className="estudiantes-coordinacion__header">
          <h1 className="estudiantes-coordinacion__title">Listado de estudiantes</h1>
          <ProgramTypeToggle
            value={programTypeSeleccionado}
            onChange={setProgramTypeSeleccionado}
            disabled={isLoadingProgramas}
          />
        </header>

        {isLoadingProgramas ? (
          <p className="estudiantes-coordinacion__status">Cargando programas...</p>
        ) : null}

        {error ? <p className="estudiantes-coordinacion__status estudiantes-coordinacion__status--error">{error}</p> : null}

        {isLoadingEstudiantes ? (
          <p className="estudiantes-coordinacion__status">Cargando estudiantes...</p>
        ) : null}

        {isEmptyStateVisible ? (
          <div className="estudiantes-coordinacion__empty" role="status">
            <span className="estudiantes-coordinacion__empty-icon" aria-hidden="true">🎓</span>
            <p>No hay estudiantes registrados para este programa.</p>
          </div>
        ) : null}

        {!isLoadingEstudiantes && estudiantes.length > 0 ? (
          <StudentHorizontalBoard
            estudiantes={estudiantes}
            onStudentClick={(estudiante) =>
              navigate(`/coordinacion/estudiantes/${estudiante.id}`, {
                state: { estudiante },
              })
            }
          />
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default EstudiantesCoordinacionPage
