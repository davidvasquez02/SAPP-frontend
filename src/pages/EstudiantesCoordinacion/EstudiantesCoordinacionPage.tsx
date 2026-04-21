import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import EstudianteCard from '../../modules/estudiantes/components/EstudianteCard/EstudianteCard'
import {
  getEstudiantesByPrograma,
  getProgramasCoordinacion,
} from '../../modules/estudiantes/services/estudiantesMockService'
import type { EstudianteCoordinacion, ProgramaCoordinacion } from '../../modules/estudiantes/types'
import './EstudiantesCoordinacionPage.css'

const EstudiantesCoordinacionPage = () => {
  const navigate = useNavigate()
  const [programas, setProgramas] = useState<ProgramaCoordinacion[]>([])
  const [programaIdSeleccionado, setProgramaIdSeleccionado] = useState<number | null>(null)
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

  useEffect(() => {
    if (!programaIdSeleccionado) {
      setEstudiantes([])
      return
    }

    const loadEstudiantes = async () => {
      setIsLoadingEstudiantes(true)
      setError(null)

      try {
        const data = await getEstudiantesByPrograma(programaIdSeleccionado)
        setEstudiantes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar los estudiantes.')
      } finally {
        setIsLoadingEstudiantes(false)
      }
    }

    loadEstudiantes()
  }, [programaIdSeleccionado])

  const programaSeleccionado = useMemo(
    () => programas.find((programa) => programa.id === programaIdSeleccionado) ?? null,
    [programaIdSeleccionado, programas]
  )

  return (
    <ModuleLayout title="Estudiantes">
      <section className="estudiantes-coordinacion">
        <header className="estudiantes-coordinacion__header">
          <h1 className="estudiantes-coordinacion__title">Listado de estudiantes</h1>
          <p className="estudiantes-coordinacion__subtitle">
            Seleccione un programa para consultar los estudiantes matriculados.
          </p>
        </header>

        <div className="estudiantes-coordinacion__filter-card">
          <label htmlFor="programa-select" className="estudiantes-coordinacion__label">
            Programa académico
          </label>
          <select
            id="programa-select"
            className="estudiantes-coordinacion__select"
            value={programaIdSeleccionado ?? ''}
            onChange={(event) => setProgramaIdSeleccionado(Number(event.target.value) || null)}
            disabled={isLoadingProgramas}
          >
            <option value="">Seleccione un programa...</option>
            {programas.map((programa) => (
              <option key={programa.id} value={programa.id}>
                {programa.codigo} · {programa.nombre}
              </option>
            ))}
          </select>
        </div>

        {isLoadingProgramas ? (
          <p className="estudiantes-coordinacion__status">Cargando programas...</p>
        ) : null}

        {error ? <p className="estudiantes-coordinacion__status estudiantes-coordinacion__status--error">{error}</p> : null}

        {!programaIdSeleccionado && !isLoadingProgramas ? (
          <p className="estudiantes-coordinacion__status">
            Debe seleccionar un programa para visualizar estudiantes.
          </p>
        ) : null}

        {programaSeleccionado ? (
          <p className="estudiantes-coordinacion__status estudiantes-coordinacion__status--context">
            Programa seleccionado: <strong>{programaSeleccionado.nombre}</strong>
          </p>
        ) : null}

        {isLoadingEstudiantes ? (
          <p className="estudiantes-coordinacion__status">Cargando estudiantes...</p>
        ) : null}

        {!isLoadingEstudiantes && programaIdSeleccionado && estudiantes.length === 0 ? (
          <p className="estudiantes-coordinacion__status">No hay estudiantes para este programa.</p>
        ) : null}

        {!isLoadingEstudiantes && estudiantes.length > 0 ? (
          <div className="estudiantes-coordinacion__grid">
            {estudiantes.map((estudiante) => (
              <EstudianteCard
                key={estudiante.id}
                estudiante={estudiante}
                onClick={() => navigate(`/coordinacion/estudiantes/${estudiante.id}`)}
              />
            ))}
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default EstudiantesCoordinacionPage
