import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../../../components'
import { getEvaluacionAdmisionInfo } from '../../api/evaluacionAdmisionService'
import EvaluacionEtapaSection, {
  type EvaluacionDraft,
} from '../../components/EvaluacionEtapaSection/EvaluacionEtapaSection'
import type {
  EvaluacionAdmisionItem,
  EtapaEvaluacion,
} from '../../types/evaluacionAdmisionTypes'
import { groupByEvaluador } from '../../utils/groupByEvaluador'
import './EvaluacionEtapaPage.css'

interface EvaluacionEtapaPageProps {
  title: string
  etapa: EtapaEvaluacion
  embedded?: boolean
}

const buildValidationMessage = (
  puntajeAspirante: number | undefined,
  puntajeMax: number,
): string | null => {
  if (puntajeAspirante === undefined || Number.isNaN(puntajeAspirante)) {
    return 'Ingrese un número'
  }

  if (puntajeAspirante < 0) {
    return 'El puntaje no puede ser negativo'
  }

  if (puntajeAspirante > puntajeMax) {
    return 'No puede superar el puntaje máximo'
  }

  return null
}

const EvaluacionEtapaPage = ({ title, etapa, embedded = false }: EvaluacionEtapaPageProps) => {
  const { convocatoriaId, inscripcionId } = useParams()
  const [items, setItems] = useState<EvaluacionAdmisionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<number, EvaluacionDraft>>({})
  const [editingRowId, setEditingRowId] = useState<number | null>(null)
  const [errorsByRow, setErrorsByRow] = useState<Record<number, string | null>>({})
  const [savingRowId, setSavingRowId] = useState<number | null>(null)
  const isEntrevista = etapa === 'ENTREVISTA'

  const inscripcionIdNumber = useMemo(
    () => (inscripcionId ? Number(inscripcionId) : NaN),
    [inscripcionId],
  )

  useEffect(() => {
    const loadEvaluacion = async () => {
      if (!inscripcionId || Number.isNaN(inscripcionIdNumber)) {
        setError('Inscripción inválida.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getEvaluacionAdmisionInfo(inscripcionIdNumber, etapa)
        setItems(data)
      } catch (errorResponse) {
        const message =
          errorResponse instanceof Error
            ? errorResponse.message
            : 'No fue posible cargar la evaluación.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadEvaluacion()
  }, [etapa, inscripcionId, inscripcionIdNumber])

  const saveEvaluacionItem = async (updated: EvaluacionAdmisionItem): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    window.alert('Guardado (mock).')
  }

  const handleEditRow = (item: EvaluacionAdmisionItem) => {
    setEditingRowId(item.id)
    setDrafts((prev) => ({
      ...prev,
      [item.id]: {
        puntajeAspirante: item.puntajeAspirante ?? undefined,
        observaciones: item.observaciones ?? '',
      },
    }))
    setErrorsByRow((prev) => ({
      ...prev,
      [item.id]: buildValidationMessage(item.puntajeAspirante ?? undefined, item.puntajeMax),
    }))
  }

  const handleCancelEdit = (id: number) => {
    setEditingRowId(null)
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setErrorsByRow((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleChangeDraft = (id: number, changes: EvaluacionDraft) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...changes,
      },
    }))

    if (Object.prototype.hasOwnProperty.call(changes, 'puntajeAspirante')) {
      const item = items.find((current) => current.id === id)
      if (item) {
        const validation = buildValidationMessage(changes.puntajeAspirante, item.puntajeMax)
        setErrorsByRow((prev) => ({
          ...prev,
          [id]: validation,
        }))
      }
    }
  }

  const handleSaveItem = async (updated: EvaluacionAdmisionItem) => {
    if (errorsByRow[updated.id]) {
      return
    }

    setSavingRowId(updated.id)
    try {
      await saveEvaluacionItem(updated)
      handleCancelEdit(updated.id)
    } catch (errorResponse) {
      const message =
        errorResponse instanceof Error ? errorResponse.message : 'No fue posible guardar.'
      window.alert(message)
    } finally {
      setSavingRowId(null)
    }
  }

  const entrevistaItems = useMemo(
    () => items.filter((item) => item.etapaEvaluacion === 'ENTREVISTA'),
    [items],
  )
  const resumenEntrevista = useMemo(
    () => entrevistaItems.find((item) => item.codigo === 'ENTREV'),
    [entrevistaItems],
  )
  const itemsSinResumen = useMemo(
    () => entrevistaItems.filter((item) => item.codigo !== 'ENTREV'),
    [entrevistaItems],
  )
  const gruposEntrevista = useMemo(
    () => groupByEvaluador(itemsSinResumen),
    [itemsSinResumen],
  )

  const content = (
    <section
      className={`evaluacion-etapa-page${embedded ? ' evaluacion-etapa-page--embedded' : ''}`}
    >
      {!embedded ? (
        <>
          <Link
            className="evaluacion-etapa-page__back"
            to={`/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcionId}`}
          >
            ← Volver a Inscripción
          </Link>
          <div className="evaluacion-etapa-page__header">
            <h1 className="evaluacion-etapa-page__title">{title}</h1>
            <p className="evaluacion-etapa-page__meta">Inscripción #{inscripcionId}</p>
          </div>
        </>
      ) : (
        <p className="evaluacion-etapa-page__meta">Inscripción #{inscripcionId}</p>
      )}

      {loading && <p className="evaluacion-etapa-page__status">Cargando evaluación...</p>}
      {!loading && error && (
        <p className="evaluacion-etapa-page__status evaluacion-etapa-page__status--error">
          {error}
        </p>
      )}

      {!loading && !error && !isEntrevista && (
        <EvaluacionEtapaSection
          title={`Componentes de ${title.toLowerCase()}`}
          etapa={etapa}
          items={items}
          drafts={drafts}
          editingRowId={editingRowId}
          errorsByRow={errorsByRow}
          savingRowId={savingRowId}
          onEditRow={handleEditRow}
          onCancelEdit={handleCancelEdit}
          onChangeDraft={handleChangeDraft}
          onSaveItem={handleSaveItem}
        />
      )}
      {!loading && !error && isEntrevista && entrevistaItems.length === 0 && (
        <p className="evaluacion-etapa-page__status">No hay evaluaciones de entrevista.</p>
      )}
      {!loading && !error && isEntrevista && entrevistaItems.length > 0 && (
        <div className="evaluacion-etapa-page__groups">
          {resumenEntrevista && (
            <section className="evaluacion-etapa-page__summary">
              <h2 className="evaluacion-etapa-page__summary-title">Resumen entrevista</h2>
              <div className="evaluacion-etapa-page__summary-grid">
                <div>
                  <p className="evaluacion-etapa-page__summary-label">Puntaje</p>
                  <p className="evaluacion-etapa-page__summary-value">
                    {resumenEntrevista.puntajeAspirante ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="evaluacion-etapa-page__summary-label">Puntaje máximo</p>
                  <p className="evaluacion-etapa-page__summary-value">
                    {resumenEntrevista.puntajeMax}
                  </p>
                </div>
                <div>
                  <p className="evaluacion-etapa-page__summary-label">Consideraciones</p>
                  <p className="evaluacion-etapa-page__summary-value">
                    {resumenEntrevista.consideraciones || '-'}
                  </p>
                </div>
                <div>
                  <p className="evaluacion-etapa-page__summary-label">Observaciones</p>
                  <p className="evaluacion-etapa-page__summary-value">
                    {resumenEntrevista.observaciones || '-'}
                  </p>
                </div>
              </div>
            </section>
          )}
          {gruposEntrevista.map((grupo) => (
            <div key={grupo.evaluadorKey} className="evaluacion-etapa-page__group">
              <h2 className="evaluacion-etapa-page__group-title">{grupo.evaluadorLabel}</h2>
              <EvaluacionEtapaSection
                title="Componentes evaluados"
                etapa={etapa}
                items={grupo.items}
                drafts={drafts}
                editingRowId={editingRowId}
                errorsByRow={errorsByRow}
                savingRowId={savingRowId}
                onEditRow={handleEditRow}
                onCancelEdit={handleCancelEdit}
                onChangeDraft={handleChangeDraft}
                onSaveItem={handleSaveItem}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )

  if (embedded) {
    return content
  }

  return <ModuleLayout title="Admisiones">{content}</ModuleLayout>
}

export default EvaluacionEtapaPage
