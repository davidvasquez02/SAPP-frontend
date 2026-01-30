import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { convocatoriasMock } from '../../modules/admisiones/mock/convocatorias.mock'
import { formatoPeriodo } from '../../modules/admisiones/types'
import './AdmisionesHomePage.css'

const sortConvocatorias = (
  a: (typeof convocatoriasMock)[number],
  b: (typeof convocatoriasMock)[number]
) => {
  if (a.periodo.anio !== b.periodo.anio) {
    return b.periodo.anio - a.periodo.anio
  }

  return b.periodo.periodo - a.periodo.periodo
}

const AdmisionesHomePage = () => {
  const navigate = useNavigate()
  const [showAnteriores, setShowAnteriores] = useState(false)

  const orderedConvocatorias = useMemo(
    () => [...convocatoriasMock].sort(sortConvocatorias),
    []
  )

  const convocatoriaActual = useMemo(() => {
    if (orderedConvocatorias.length === 0) {
      return null
    }

    const abiertas = orderedConvocatorias.filter((convocatoria) => {
      return convocatoria.estado === 'ABIERTA'
    })

    if (abiertas.length > 0) {
      return [...abiertas].sort(sortConvocatorias)[0]
    }

    return orderedConvocatorias[0]
  }, [orderedConvocatorias])

  const convocatoriasAnteriores = useMemo(() => {
    if (!convocatoriaActual) {
      return orderedConvocatorias
    }

    return orderedConvocatorias.filter(
      (convocatoria) => convocatoria.id !== convocatoriaActual.id
    )
  }, [orderedConvocatorias, convocatoriaActual])

  const handleSelectConvocatoria = (id: number) => {
    navigate(`/admisiones/convocatoria/${id}`)
  }

  return (
    <ModuleLayout title="Admisiones">
      <section className="admisiones-home">
        <header className="admisiones-home__header">
          <h1 className="admisiones-home__title">Admisiones</h1>
          <p className="admisiones-home__subtitle">Seleccione una convocatoria</p>
        </header>

        <div className="admisiones-home__actions">
          <button
            type="button"
            className="admisiones-home__card"
            onClick={() =>
              convocatoriaActual && handleSelectConvocatoria(convocatoriaActual.id)
            }
            disabled={!convocatoriaActual}
          >
            <span className="admisiones-home__card-title">Convocatoria actual</span>
            {convocatoriaActual ? (
              <span className="admisiones-home__card-meta">
                {convocatoriaActual.programaNombre} ·{' '}
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
            onClick={() => setShowAnteriores((prev) => !prev)}
          >
            <span className="admisiones-home__card-title">Convocatorias anteriores</span>
            <span className="admisiones-home__card-meta">
              {showAnteriores ? 'Ocultar listado' : 'Ver listado disponible'}
            </span>
          </button>
        </div>

        {showAnteriores ? (
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
                      onClick={() => handleSelectConvocatoria(convocatoria.id)}
                    >
                      <span>{convocatoria.programaNombre}</span>
                      <span>
                        {formatoPeriodo(convocatoria.periodo)} ·{' '}
                        {convocatoria.estado}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default AdmisionesHomePage
