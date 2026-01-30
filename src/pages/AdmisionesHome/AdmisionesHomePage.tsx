import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { convocatoriasMock } from '../../modules/admisiones/mock/convocatorias.mock'
import type { Convocatoria } from '../../modules/admisiones/types'
import { formatoPeriodo } from '../../modules/admisiones/types'
import './AdmisionesHomePage.css'

const sortConvocatorias = (a: Convocatoria, b: Convocatoria) => {
  if (a.periodo.anio !== b.periodo.anio) {
    return b.periodo.anio - a.periodo.anio
  }

  return b.periodo.periodo - a.periodo.periodo
}

const getConvocatoriaActual = (convocatorias: Convocatoria[]) => {
  if (convocatorias.length === 0) {
    return null
  }

  const abiertas = convocatorias.filter((convocatoria) => {
    return convocatoria.estado === 'ABIERTA'
  })

  if (abiertas.length > 0) {
    return [...abiertas].sort(sortConvocatorias)[0]
  }

  return [...convocatorias].sort(sortConvocatorias)[0]
}

const AdmisionesHomePage = () => {
  const navigate = useNavigate()
  const [expandedPrograms, setExpandedPrograms] = useState<Record<number, boolean>>(
    {}
  )

  const programas = useMemo(() => {
    const grouped = new Map<
      number,
      {
        programaId: number
        programaNombre: string
        programaNivel: Convocatoria['programaNivel']
        convocatorias: Convocatoria[]
      }
    >()

    convocatoriasMock.forEach((convocatoria) => {
      if (!grouped.has(convocatoria.programaId)) {
        grouped.set(convocatoria.programaId, {
          programaId: convocatoria.programaId,
          programaNombre: convocatoria.programaNombre,
          programaNivel: convocatoria.programaNivel,
          convocatorias: [],
        })
      }

      grouped.get(convocatoria.programaId)?.convocatorias.push(convocatoria)
    })

    return Array.from(grouped.values())
      .map((programa) => ({
        ...programa,
        convocatorias: [...programa.convocatorias].sort(sortConvocatorias),
      }))
      .sort((a, b) => a.programaId - b.programaId)
  }, [])

  const handleSelectConvocatoria = (id: number) => {
    navigate(`/admisiones/convocatoria/${id}`)
  }

  const togglePrograma = (programaId: number) => {
    setExpandedPrograms((prev) => ({
      ...prev,
      [programaId]: !prev[programaId],
    }))
  }

  return (
    <ModuleLayout title="Admisiones">
      <section className="admisiones-home">
        <header className="admisiones-home__header">
          <h1 className="admisiones-home__title">Seleccione una convocatoria</h1>
        </header>

        <div className="admisiones-home__programs">
          {programas.map((programa) => {
            const convocatoriaActual = getConvocatoriaActual(
              programa.convocatorias
            )
            const convocatoriasAnteriores = convocatoriaActual
              ? programa.convocatorias.filter(
                  (convocatoria) => convocatoria.id !== convocatoriaActual.id
                )
              : programa.convocatorias
            const isExpanded = expandedPrograms[programa.programaId] ?? false

            return (
              <section
                key={programa.programaId}
                className="admisiones-home__program"
              >
                <h2 className="admisiones-home__program-title">
                  {programa.programaNombre}
                </h2>

                <div className="admisiones-home__actions">
                  <button
                    type="button"
                    className="admisiones-home__card"
                    onClick={() =>
                      convocatoriaActual &&
                      handleSelectConvocatoria(convocatoriaActual.id)
                    }
                    disabled={!convocatoriaActual}
                  >
                    <span className="admisiones-home__card-title">
                      Convocatoria actual
                    </span>
                    {convocatoriaActual ? (
                      <span className="admisiones-home__card-meta">
                        {formatoPeriodo(convocatoriaActual.periodo)} ·{' '}
                        {convocatoriaActual.estado}
                      </span>
                    ) : (
                      <span className="admisiones-home__card-meta">
                        No hay convocatorias disponibles
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="admisiones-home__card admisiones-home__card--secondary"
                    onClick={() => togglePrograma(programa.programaId)}
                  >
                    <span className="admisiones-home__card-title">
                      Convocatorias anteriores
                    </span>
                    <span className="admisiones-home__card-meta">
                      {isExpanded ? 'Ocultar listado' : 'Ver listado disponible'}
                    </span>
                  </button>
                </div>

                {isExpanded ? (
                  <div className="admisiones-home__list">
                    {convocatoriasAnteriores.length === 0 ? (
                      <p className="admisiones-home__empty">
                        No hay convocatorias anteriores registradas.
                      </p>
                    ) : (
                      <ul className="admisiones-home__items">
                        {convocatoriasAnteriores.map((convocatoria) => (
                          <li key={convocatoria.id}>
                            <button
                              type="button"
                              className="admisiones-home__item"
                              onClick={() =>
                                handleSelectConvocatoria(convocatoria.id)
                              }
                            >
                              <span>
                                {formatoPeriodo(convocatoria.periodo)} —{' '}
                                {convocatoria.estado}
                              </span>
                              {typeof convocatoria.cupos === 'number' ? (
                                <span>Cupos: {convocatoria.cupos}</span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      </section>
    </ModuleLayout>
  )
}

export default AdmisionesHomePage
