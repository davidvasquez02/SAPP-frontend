import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { getConvocatoriasAdmision } from '../../modules/admisiones/api/convocatoriaAdmisionService'
import type { ConvocatoriaAdmisionDto } from '../../modules/admisiones/api/convocatoriaAdmisionTypes'
import { getProgramaNombreLargo } from '../../modules/admisiones/utils/programNames'
import { parsePeriodo } from '../../modules/admisiones/utils/periodo'
import './AdmisionesHomePage.css'

const sortByPeriodoDesc = (
  a: ConvocatoriaAdmisionDto,
  b: ConvocatoriaAdmisionDto
): number => {
  const periodoA = parsePeriodo(a.periodo)
  const periodoB = parsePeriodo(b.periodo)

  if (periodoA.anio !== periodoB.anio) {
    return periodoB.anio - periodoA.anio
  }

  return periodoB.semestre - periodoA.semestre
}

const getConvocatoriaVigente = (
  convocatorias: ConvocatoriaAdmisionDto[]
): ConvocatoriaAdmisionDto | null => {
  if (convocatorias.length === 0) {
    return null
  }

  const vigentes = convocatorias.filter((convocatoria) => convocatoria.vigente)
  const candidates = vigentes.length > 0 ? vigentes : convocatorias

  return [...candidates].sort(sortByPeriodoDesc)[0] ?? null
}

const AdmisionesHomePage = () => {
  const navigate = useNavigate()
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaAdmisionDto[]>([])
  const [selectedPrevious, setSelectedPrevious] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConvocatorias = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getConvocatoriasAdmision()
      setConvocatorias(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No fue posible cargar las convocatorias.'
      setError(message)
      setConvocatorias([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConvocatorias()
  }, [loadConvocatorias])

  const programas = useMemo(() => {
    const grouped = new Map<
      number,
      {
        programaId: number
        programa: string
        convocatorias: ConvocatoriaAdmisionDto[]
      }
    >()

    convocatorias.forEach((convocatoria) => {
      if (!grouped.has(convocatoria.programaId)) {
        grouped.set(convocatoria.programaId, {
          programaId: convocatoria.programaId,
          programa: convocatoria.programa,
          convocatorias: [],
        })
      }

      grouped.get(convocatoria.programaId)?.convocatorias.push(convocatoria)
    })

    return Array.from(grouped.values()).sort((a, b) => a.programaId - b.programaId)
  }, [convocatorias])

  const handleNavigate = useCallback(
    (convocatoria: ConvocatoriaAdmisionDto, programaNombre: string) => {
      navigate(`/admisiones/convocatoria/${convocatoria.id}`, {
        state: {
          programaId: convocatoria.programaId,
          programaNombre,
          periodoLabel: convocatoria.periodo,
          periodoAcademico: convocatoria.periodo,
        },
      })
    },
    [navigate]
  )

  const handlePreviousChange = useCallback(
    (
      programaId: number,
      programaNombre: string,
      anteriores: ConvocatoriaAdmisionDto[],
      value: string
    ) => {
      setSelectedPrevious((prev) => ({ ...prev, [programaId]: value }))

      if (!value) {
        return
      }

      const selectedId = Number(value)
      const selected = anteriores.find((convocatoria) => convocatoria.id === selectedId)

      if (!selected) {
        return
      }

      handleNavigate(selected, programaNombre)
      setSelectedPrevious((prev) => ({ ...prev, [programaId]: '' }))
    },
    [handleNavigate]
  )

  return (
    <ModuleLayout title="Admisiones">
      <section className="admisiones-home">
        <header className="admisiones-home__header">
          <h1 className="admisiones-home__title">Seleccione una convocatoria</h1>
        </header>

        {isLoading ? (
          <p className="admisiones-home__status">Cargando convocatorias...</p>
        ) : null}

        {!isLoading && error ? (
          <div className="admisiones-home__status admisiones-home__status--error">
            <p>{error}</p>
            <button
              type="button"
              className="admisiones-home__retry"
              onClick={loadConvocatorias}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && convocatorias.length === 0 ? (
          <p className="admisiones-home__status">No hay convocatorias disponibles.</p>
        ) : null}

        {!isLoading && !error && convocatorias.length > 0 ? (
          <div className="admisiones-home__programs">
            {programas.map((programa) => {
              const convocatoriaVigente = getConvocatoriaVigente(programa.convocatorias)
              const anteriores = convocatoriaVigente
                ? programa.convocatorias.filter(
                    (convocatoria) => convocatoria.id !== convocatoriaVigente.id
                  )
                : programa.convocatorias
              const anterioresOrdenadas = [...anteriores].sort(sortByPeriodoDesc)
              const programaNombre = getProgramaNombreLargo(
                programa.programaId,
                programa.programa
              )

              return (
                <section
                  key={programa.programaId}
                  className="admisiones-home__program"
                >
                  <div className="admisiones-home__program-header">
                    <h2 className="admisiones-home__program-title">{programaNombre}</h2>
                    {programa.programa ? (
                      <p className="admisiones-home__program-subtitle">
                        {programa.programa}
                      </p>
                    ) : null}
                  </div>

                  <div className="admisiones-home__card">
                    <div className="admisiones-home__card-header">
                      <div>
                        <span className="admisiones-home__card-title">
                          Convocatoria vigente
                        </span>
                        <span className="admisiones-home__card-meta">
                          {convocatoriaVigente
                            ? convocatoriaVigente.periodo
                            : 'No disponible'}
                        </span>
                      </div>
                      <span className="admisiones-home__pill">Vigente</span>
                    </div>

                    {convocatoriaVigente ? (
                      <div className="admisiones-home__card-details">
                        <span>
                          Cupos:{' '}
                          {typeof convocatoriaVigente.cupos === 'number'
                            ? convocatoriaVigente.cupos
                            : 'Por definir'}
                        </span>
                        <span>Inicio: {convocatoriaVigente.fechaInicio}</span>
                        <span>Fin: {convocatoriaVigente.fechaFin}</span>
                      </div>
                    ) : (
                      <p className="admisiones-home__card-meta">
                        No hay convocatorias disponibles.
                      </p>
                    )}

                    <button
                      type="button"
                      className="admisiones-home__enter-button"
                      disabled={!convocatoriaVigente}
                      onClick={() =>
                        convocatoriaVigente &&
                        handleNavigate(convocatoriaVigente, programaNombre)
                      }
                    >
                      Entrar
                    </button>
                  </div>

                  <div className="admisiones-home__previous">
                    <label className="admisiones-home__card-title" htmlFor={`prev-${
                      programa.programaId
                    }`}>
                      Convocatorias anteriores
                    </label>

                    {anterioresOrdenadas.length === 0 ? (
                      <p className="admisiones-home__empty">
                        No hay convocatorias anteriores.
                      </p>
                    ) : (
                      <select
                        id={`prev-${programa.programaId}`}
                        className="admisiones-home__select"
                        value={selectedPrevious[programa.programaId] ?? ''}
                        onChange={(event) =>
                          handlePreviousChange(
                            programa.programaId,
                            programaNombre,
                            anterioresOrdenadas,
                            event.target.value
                          )
                        }
                      >
                        <option value="">Seleccione periodo...</option>
                        {anterioresOrdenadas.map((convocatoria) => (
                          <option key={convocatoria.id} value={convocatoria.id}>
                            {convocatoria.periodo}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default AdmisionesHomePage
