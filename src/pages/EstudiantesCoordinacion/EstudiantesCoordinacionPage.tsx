import { useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import { getProgramasCoordinacion } from '../../modules/estudiantes/services/estudiantesMockService'
import type { ProgramaCoordinacion } from '../../modules/estudiantes/types'
import {
  getMatriculasCoordinacion,
  type MatriculaCoordinacionEstado,
  type MatriculaCoordinacionFilters,
  type MatriculaCoordinacionItem,
} from '../../modules/matricula/services/coordinacionMatriculasService'
import './EstudiantesCoordinacionPage.css'

const ESTADOS_MATRICULA: MatriculaCoordinacionEstado[] = [
  'RADICADA',
  'EN_REVISION',
  'FINALIZADA',
  'PENDIENTE_DOCUMENTOS',
]

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Sin fecha'
  }

  const normalized = value.replace(' ', 'T')
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(date)
}

const formatEstado = (estado: string) => estado.replaceAll('_', ' ')

const buildGroupKey = (matricula: MatriculaCoordinacionItem) => matricula.programaAcademico || 'SIN_PROGRAMA'

const EstudiantesCoordinacionPage = () => {
  const [programas, setProgramas] = useState<ProgramaCoordinacion[]>([])
  const [matriculas, setMatriculas] = useState<MatriculaCoordinacionItem[]>([])
  const [filters, setFilters] = useState<MatriculaCoordinacionFilters>({})
  const [selectedMatriculaId, setSelectedMatriculaId] = useState<number | null>(null)
  const [isLoadingProgramas, setIsLoadingProgramas] = useState(true)
  const [isLoadingMatriculas, setIsLoadingMatriculas] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProgramas = async () => {
      setIsLoadingProgramas(true)

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
    const loadMatriculas = async () => {
      setIsLoadingMatriculas(true)
      setError(null)

      try {
        const data = await getMatriculasCoordinacion(filters)
        setMatriculas(data)

        if (data.length === 0) {
          setSelectedMatriculaId(null)
          return
        }

        setSelectedMatriculaId((current) => {
          if (current && data.some((item) => item.id === current)) {
            return current
          }

          return data[0].id
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar las matrículas.')
      } finally {
        setIsLoadingMatriculas(false)
      }
    }

    loadMatriculas()
  }, [filters])

  const selectedMatricula = useMemo(
    () => matriculas.find((item) => item.id === selectedMatriculaId) ?? null,
    [matriculas, selectedMatriculaId]
  )

  const matriculasByPrograma = useMemo(() => {
    const grouped = new Map<string, MatriculaCoordinacionItem[]>()

    matriculas.forEach((matricula) => {
      const key = buildGroupKey(matricula)
      const items = grouped.get(key) ?? []
      items.push(matricula)
      grouped.set(key, items)
    })

    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [matriculas])

  return (
    <ModuleLayout title="Matrículas coordinación">
      <section className="estudiantes-coordinacion">
        <header className="estudiantes-coordinacion__header">
          <h1 className="estudiantes-coordinacion__title">Matrículas académicas</h1>
          <p className="estudiantes-coordinacion__subtitle">
            Consulte el listado de matrículas por programa y revise el detalle de la matrícula seleccionada.
          </p>
        </header>

        <div className="estudiantes-coordinacion__filter-card">
          <label htmlFor="programa-select" className="estudiantes-coordinacion__label">
            Programa académico
          </label>
          <select
            id="programa-select"
            className="estudiantes-coordinacion__select"
            value={filters.programaId ?? ''}
            disabled={isLoadingProgramas}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                programaId: Number(event.target.value) || undefined,
              }))
            }
          >
            <option value="">Todos</option>
            {programas.map((programa) => (
              <option key={programa.id} value={programa.id}>
                {programa.codigo} · {programa.nombre}
              </option>
            ))}
          </select>

          <label htmlFor="periodo-id" className="estudiantes-coordinacion__label">
            Periodo ID
          </label>
          <input
            id="periodo-id"
            className="estudiantes-coordinacion__input"
            type="number"
            min={1}
            value={filters.periodoId ?? ''}
            placeholder="Ej: 1"
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                periodoId: Number(event.target.value) || undefined,
              }))
            }
          />

          <label htmlFor="estado-select" className="estudiantes-coordinacion__label">
            Estado
          </label>
          <select
            id="estado-select"
            className="estudiantes-coordinacion__select"
            value={filters.estado ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                estado: event.target.value || undefined,
              }))
            }
          >
            <option value="">Todos</option>
            {ESTADOS_MATRICULA.map((estado) => (
              <option key={estado} value={estado}>
                {formatEstado(estado)}
              </option>
            ))}
          </select>

          <label htmlFor="matricula-id" className="estudiantes-coordinacion__label">
            Matrícula ID
          </label>
          <input
            id="matricula-id"
            className="estudiantes-coordinacion__input"
            type="number"
            min={1}
            value={filters.matriculaId ?? ''}
            placeholder="Ej: 24"
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                matriculaId: Number(event.target.value) || undefined,
              }))
            }
          />
        </div>

        {isLoadingMatriculas ? <p className="estudiantes-coordinacion__status">Cargando matrículas...</p> : null}

        {error ? <p className="estudiantes-coordinacion__status estudiantes-coordinacion__status--error">{error}</p> : null}

        {!isLoadingMatriculas && matriculas.length === 0 ? (
          <p className="estudiantes-coordinacion__status">No se encontraron matrículas con los filtros seleccionados.</p>
        ) : null}

        {!isLoadingMatriculas && matriculas.length > 0 ? (
          <div className="estudiantes-coordinacion__content">
            <div className="estudiantes-coordinacion__list">
              {matriculasByPrograma.map(([programa, items]) => (
                <article className="estudiantes-coordinacion__programa" key={programa}>
                  <h2 className="estudiantes-coordinacion__programa-title">{programa}</h2>
                  <ul className="estudiantes-coordinacion__items">
                    {items.map((matricula) => (
                      <li key={matricula.id}>
                        <button
                          type="button"
                          className={`estudiantes-coordinacion__item${
                            selectedMatriculaId === matricula.id ? ' estudiantes-coordinacion__item--active' : ''
                          }`}
                          onClick={() => setSelectedMatriculaId(matricula.id)}
                        >
                          <span className="estudiantes-coordinacion__item-main">
                            {matricula.codigoEstudianteUis} · {matricula.estudianteNombreCompleto}
                          </span>
                          <span className="estudiantes-coordinacion__item-meta">
                            #{matricula.id} · {formatEstado(matricula.estado)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <aside className="estudiantes-coordinacion__detail" aria-live="polite">
              {selectedMatricula ? (
                <>
                  <h2>Detalle de matrícula #{selectedMatricula.id}</h2>
                  <p>
                    <strong>Estudiante:</strong> {selectedMatricula.estudianteNombreCompleto} ({selectedMatricula.codigoEstudianteUis})
                  </p>
                  <p>
                    <strong>Programa:</strong> {selectedMatricula.programaAcademico}
                  </p>
                  <p>
                    <strong>Periodo:</strong> {selectedMatricula.periodoAcademico} (ID {selectedMatricula.periodoId})
                  </p>
                  <p>
                    <strong>Estado:</strong> {formatEstado(selectedMatricula.estado)}
                  </p>
                  <p>
                    <strong>Fecha solicitud:</strong> {formatDateTime(selectedMatricula.fechaSolicitud)}
                  </p>
                  <p>
                    <strong>Fecha revisión:</strong> {formatDateTime(selectedMatricula.fechaRevision)}
                  </p>

                  <h3>Asignaturas seleccionadas</h3>
                  <ul className="estudiantes-coordinacion__subjects">
                    {selectedMatricula.asignaturas.map((asignatura) => (
                      <li key={asignatura.id}>
                        <span>
                          {asignatura.asignaturaCodigo ?? 'SIN-CÓDIGO'} · {asignatura.asignaturaNombre}
                        </span>
                        <small>
                          Grupo {asignatura.grupo} · {formatEstado(asignatura.estado)}
                        </small>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="estudiantes-coordinacion__status">Seleccione una matrícula para ver su detalle.</p>
              )}
            </aside>
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default EstudiantesCoordinacionPage
