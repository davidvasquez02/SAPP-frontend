import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import { convocatoriasMock } from '../../modules/admisiones/mock/convocatorias.mock'
import { formatoPeriodo } from '../../modules/admisiones/types'
import './ConvocatoriaDetallePage.css'

const ConvocatoriaDetallePage = () => {
  const { convocatoriaId } = useParams()
  const convocatoriaIdNumber = convocatoriaId ? Number(convocatoriaId) : null

  const convocatoria = useMemo(() => {
    if (!convocatoriaIdNumber) {
      return null
    }

    return convocatoriasMock.find((item) => item.id === convocatoriaIdNumber) || null
  }, [convocatoriaIdNumber])

  return (
    <ModuleLayout title="Admisiones">
      <section className="convocatoria-detalle">
        <Link className="convocatoria-detalle__back" to="/admisiones">
          ← Volver
        </Link>

        <h1 className="convocatoria-detalle__title">
          Convocatoria {convocatoriaId}
        </h1>
        <p className="convocatoria-detalle__subtitle">En construcción.</p>

        {convocatoria ? (
          <div className="convocatoria-detalle__meta">
            <p>
              <strong>Programa:</strong> {convocatoria.programaNombre}
            </p>
            <p>
              <strong>Periodo:</strong> {formatoPeriodo(convocatoria.periodo)}
            </p>
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default ConvocatoriaDetallePage
