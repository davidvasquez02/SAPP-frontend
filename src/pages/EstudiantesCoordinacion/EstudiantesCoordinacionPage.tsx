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

const normalizarTextoBusqueda = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es-CO')

const compararPeriodosDescendente = (left: string, right: string) =>
  right.localeCompare(left, 'es-CO', { numeric: true, sensitivity: 'base' })

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
  const [periodoFiltro, setPeriodoFiltro] = useState('')
  const [nombreFiltro, setNombreFiltro] = useState('')
  const [codigoFiltro, setCodigoFiltro] = useState('')

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

  const periodosDisponibles = useMemo(
    () => [...new Set(estudiantes.map((estudiante) => estudiante.cohorte))].sort(compararPeriodosDescendente),
    [estudiantes],
  )

  const estudiantesVisibles = useMemo(() => {
    const nombreNormalizado = normalizarTextoBusqueda(nombreFiltro)
    const codigoNormalizado = normalizarTextoBusqueda(codigoFiltro)

    return estudiantes
      .filter((estudiante) => !periodoFiltro || estudiante.cohorte === periodoFiltro)
      .filter((estudiante) =>
        !nombreNormalizado || normalizarTextoBusqueda(estudiante.nombreCompleto).includes(nombreNormalizado),
      )
      .filter((estudiante) =>
        !codigoNormalizado || normalizarTextoBusqueda(estudiante.codigo).includes(codigoNormalizado),
      )
      .sort((left, right) => {
        const periodoComparison = compararPeriodosDescendente(left.cohorte, right.cohorte)
        return periodoComparison || left.nombreCompleto.localeCompare(right.nombreCompleto, 'es-CO')
      })
  }, [codigoFiltro, estudiantes, nombreFiltro, periodoFiltro])

  const filtrosActivos = Boolean(periodoFiltro || nombreFiltro.trim() || codigoFiltro.trim())

  const limpiarFiltros = () => {
    setPeriodoFiltro('')
    setNombreFiltro('')
    setCodigoFiltro('')
  }

  return (
    <ModuleLayout title="Estudiantes">
      <section className="estudiantes-coordinacion">
        <header className="estudiantes-coordinacion__header">
          <h1 className="estudiantes-coordinacion__title">Listado de estudiantes</h1>
          <ProgramTypeToggle
            value={programTypeSeleccionado}
            onChange={(programType) => {
              setProgramTypeSeleccionado(programType)
              limpiarFiltros()
            }}
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

        {!isLoadingEstudiantes && estudiantes.length > 0 ? (
          <section className="estudiantes-coordinacion__filters" aria-labelledby="filtros-estudiantes-title">
            <div className="estudiantes-coordinacion__filters-heading">
              <div>
                <h2 id="filtros-estudiantes-title">Filtrar estudiantes</h2>
                <p>{estudiantesVisibles.length} de {estudiantes.length} estudiantes</p>
              </div>
              {filtrosActivos ? (
                <button type="button" className="estudiantes-coordinacion__clear" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              ) : null}
            </div>

            <div className="estudiantes-coordinacion__filter-grid">
              <label className="estudiantes-coordinacion__field">
                <span>Período</span>
                <select value={periodoFiltro} onChange={(event) => setPeriodoFiltro(event.target.value)}>
                  <option value="">Todos los períodos</option>
                  {periodosDisponibles.map((periodo) => (
                    <option key={periodo} value={periodo}>{periodo}</option>
                  ))}
                </select>
              </label>
              <label className="estudiantes-coordinacion__field">
                <span>Nombre</span>
                <input
                  type="search"
                  value={nombreFiltro}
                  onChange={(event) => setNombreFiltro(event.target.value)}
                  placeholder="Buscar por nombre"
                />
              </label>
              <label className="estudiantes-coordinacion__field">
                <span>Código</span>
                <input
                  type="search"
                  value={codigoFiltro}
                  onChange={(event) => setCodigoFiltro(event.target.value)}
                  placeholder="Buscar por código UIS"
                />
              </label>
            </div>
          </section>
        ) : null}

        {isEmptyStateVisible ? (
          <div className="estudiantes-coordinacion__empty" role="status">
            <span className="estudiantes-coordinacion__empty-icon" aria-hidden="true">🎓</span>
            <p>No hay estudiantes registrados para este programa.</p>
          </div>
        ) : null}

        {!isLoadingEstudiantes && estudiantes.length > 0 && estudiantesVisibles.length === 0 ? (
          <div className="estudiantes-coordinacion__empty" role="status">
            <span className="estudiantes-coordinacion__empty-icon" aria-hidden="true">⌕</span>
            <p>No hay estudiantes que coincidan con los filtros seleccionados.</p>
          </div>
        ) : null}

        {!isLoadingEstudiantes && estudiantesVisibles.length > 0 ? (
          <StudentHorizontalBoard
            estudiantes={estudiantesVisibles}
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
