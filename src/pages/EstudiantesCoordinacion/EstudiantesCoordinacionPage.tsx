import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getInscripcionByAspirante } from '../../modules/admisiones/api/inscripcionAdmisionService'
import { getFotoDocumentoByTramite } from '../../modules/documentos/api/documentoFotoService'
import ProgramTypeToggle, { type ProgramType } from '../../modules/estudiantes/components/ProgramTypeToggle/ProgramTypeToggle'
import StudentHorizontalBoard from '../../modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard'
import {
  getEstudiantesByPrograma,
  getProgramasCoordinacion,
} from '../../modules/estudiantes/services/estudiantesMockService'
import {
  cacheEstudiantesListForDetail,
  consumeEstudiantesListFromDetail,
} from '../../modules/estudiantes/services/estudiantesListCache'
import type { EstudianteCoordinacion, ProgramaCoordinacion } from '../../modules/estudiantes/types'
import './EstudiantesCoordinacionPage.css'

const FOTO_CONCURRENCY_LIMIT = 4

const loadWithConcurrencyLimit = async <T,>(
  items: T[],
  task: (item: T) => Promise<void>,
): Promise<void> => {
  let nextIndex = 0
  const worker = async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex]
      nextIndex += 1
      await task(item)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(FOTO_CONCURRENCY_LIMIT, items.length) }, () => worker()),
  )
}

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
  const [initialSnapshot] = useState(consumeEstudiantesListFromDetail)
  const shouldReuseInitialStudents = useRef(Boolean(initialSnapshot))
  const [programas, setProgramas] = useState<ProgramaCoordinacion[]>(initialSnapshot?.programas ?? [])
  const [programTypeSeleccionado, setProgramTypeSeleccionado] = useState<ProgramType>(
    initialSnapshot?.programTypeSeleccionado ?? 'doctorado',
  )
  const [estudiantes, setEstudiantes] = useState<EstudianteCoordinacion[]>(initialSnapshot?.estudiantes ?? [])
  const [isLoadingProgramas, setIsLoadingProgramas] = useState(!initialSnapshot)
  const [isLoadingEstudiantes, setIsLoadingEstudiantes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialSnapshot) {
      return
    }

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
  }, [initialSnapshot])

  const programaSeleccionado = useMemo(
    () => programas.find((programa) => getProgramaType(programa) === programTypeSeleccionado) ?? null,
    [programTypeSeleccionado, programas]
  )

  useEffect(() => {
    let isCurrentRequest = true

    if (shouldReuseInitialStudents.current) {
      shouldReuseInitialStudents.current = false
      return () => {
        isCurrentRequest = false
      }
    }

    if (!programaSeleccionado) {
      setEstudiantes([])
      return () => {
        isCurrentRequest = false
      }
    }

    const loadEstudiantes = async () => {
      setIsLoadingEstudiantes(true)
      setError(null)

      try {
        const data = await getEstudiantesByPrograma(programaSeleccionado.id)
        if (!isCurrentRequest) {
          return
        }

        setEstudiantes(data)

        const estudiantesConAspirante = data.filter(
          (estudiante): estudiante is EstudianteCoordinacion & { idAspirante: number } =>
            estudiante.idAspirante !== null,
        )

        void loadWithConcurrencyLimit(estudiantesConAspirante, async (estudiante) => {
          try {
            const inscripcion = await getInscripcionByAspirante(estudiante.idAspirante)
            if (!inscripcion || !isCurrentRequest) {
              return
            }

            const fotoUrl = await getFotoDocumentoByTramite({
              codigoTipoTramite: 1002,
              codigoTipoDocumentoTramite: 'ANX-4',
              tramiteId: inscripcion.id,
            })

            if (!fotoUrl || !isCurrentRequest) {
              return
            }

            setEstudiantes((current) =>
              current.map((currentEstudiante) =>
                currentEstudiante.id === estudiante.id
                  ? { ...currentEstudiante, fotoUrl }
                  : currentEstudiante,
              ),
            )
          } catch {
            // Un fallo individual conserva el placeholder sin afectar el listado.
          }
        })
      } catch (err) {
        if (!isCurrentRequest) {
          return
        }
        setError(err instanceof Error ? err.message : 'No fue posible cargar los estudiantes.')
      } finally {
        if (isCurrentRequest) {
          setIsLoadingEstudiantes(false)
        }
      }
    }

    loadEstudiantes()

    return () => {
      isCurrentRequest = false
    }
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
            onStudentClick={(estudiante) => {
              cacheEstudiantesListForDetail({
                programas,
                programTypeSeleccionado,
                estudiantes,
              })
              navigate(`/coordinacion/estudiantes/${estudiante.id}`, {
                state: { estudiante },
              })
            }}
          />
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default EstudiantesCoordinacionPage
