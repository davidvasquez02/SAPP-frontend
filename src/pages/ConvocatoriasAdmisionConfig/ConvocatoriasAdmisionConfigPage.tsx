import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import {
  cerrarConvocatoriaAdmision,
  getConvocatoriasAdmision,
} from '../../modules/admisiones/api/convocatoriaAdmisionService'
import type { ConvocatoriaAdmisionDto } from '../../modules/admisiones/api/convocatoriaAdmisionTypes'
import { CreateConvocatoriaModal } from '../../modules/admisiones/components/CreateConvocatoriaModal'
import { isConvocatoriaVigente } from '../../modules/admisiones/utils/convocatoriaEstado'
import './ConvocatoriasAdmisionConfigPage.css'

type VigenteFilter = 'TODOS' | 'VIGENTE' | 'CERRADA'

type ProgramaSection = {
  programaId: number
  programaLabel: string
  programaRaw: string
  items: ConvocatoriaAdmisionDto[]
}

const formatFecha = (value: string) => {
  const safe = value?.trim()
  if (!safe) {
    return '-'
  }

  const datePart = safe.split(' ')[0]
  if (!datePart || !datePart.includes('-')) {
    return safe
  }

  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) {
    return safe
  }

  return `${day}/${month}/${year}`
}

const resolveProgramaLabel = (programa: string) => {
  const upper = programa.toUpperCase()

  if (upper.includes('MISI')) {
    return 'Maestría en Ingeniería de Sistemas e Informática'
  }

  if (upper.includes('DCC')) {
    return 'Doctorado en Ciencias de la Computación'
  }

  return programa
}

const ConvocatoriasAdmisionConfigPage = () => {
  const navigate = useNavigate()
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaAdmisionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [periodoFilter, setPeriodoFilter] = useState('TODOS')
  const [vigenteFilter, setVigenteFilter] = useState<VigenteFilter>('TODOS')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadConvocatorias = useCallback(async (silent = false): Promise<ConvocatoriaAdmisionDto[]> => {
    if (silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const data = await getConvocatoriasAdmision()
      setConvocatorias(data)
      return data
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar las convocatorias.'
      setError(message)
      setConvocatorias([])
      return []
    } finally {
      if (silent) {
        setIsRefreshing(false)
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadConvocatorias()
  }, [loadConvocatorias])

  const periodos = useMemo(() => {
    const unique = new Set(convocatorias.map((item) => item.periodo))
    return ['TODOS', ...Array.from(unique).sort((a, b) => b.localeCompare(a, 'es'))]
  }, [convocatorias])

  const filteredConvocatorias = useMemo(() => {
    return convocatorias.filter((convocatoria) => {
      const matchesPeriodo = periodoFilter === 'TODOS' || convocatoria.periodo === periodoFilter
      const isVigente = isConvocatoriaVigente(convocatoria)
      const matchesVigente =
        vigenteFilter === 'TODOS' || (vigenteFilter === 'VIGENTE' ? isVigente : !isVigente)

      return matchesPeriodo && matchesVigente
    })
  }, [convocatorias, periodoFilter, vigenteFilter])

  const sections = useMemo<ProgramaSection[]>(() => {
    const grouped = new Map<number, ConvocatoriaAdmisionDto[]>()

    filteredConvocatorias.forEach((item) => {
      const existing = grouped.get(item.programaId) ?? []
      existing.push(item)
      grouped.set(item.programaId, existing)
    })

    return Array.from(grouped.entries())
      .map(([programaId, items]) => {
        const programaRaw = items[0]?.programa ?? `Programa ${programaId}`

        return {
          programaId,
          programaLabel: resolveProgramaLabel(programaRaw),
          programaRaw,
          items: items.sort((a, b) => b.periodo.localeCompare(a.periodo, 'es')),
        }
      })
      .sort((a, b) => a.programaRaw.localeCompare(b.programaRaw, 'es'))
  }, [filteredConvocatorias])

  const handleCloseConvocatoria = useCallback(
    async (convocatoria: ConvocatoriaAdmisionDto) => {
      const confirmed = window.confirm(
        `¿Cerrar convocatoria ${convocatoria.periodo} - ${convocatoria.programa}?`
      )

      if (!confirmed) {
        return
      }

      try {
        await cerrarConvocatoriaAdmision(convocatoria.id)
        await loadConvocatorias(true)
        setFeedback('Convocatoria cerrada correctamente.')
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'No fue posible cerrar la convocatoria.'
        setError(message)
      }
    },
    [loadConvocatorias]
  )

  return (
    <ModuleLayout title="Configuración de convocatorias">
      <section className="convocatorias-config">
        <header className="convocatorias-config__header">
          <div>
            <h1>Configuración de convocatorias de admisión</h1>
            <p>Gestione convocatorias por programa, periodo y estado de vigencia.</p>
          </div>
          <button
            type="button"
            className="convocatorias-config__new-button"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nueva convocatoria
          </button>
        </header>

        <div className="convocatorias-config__filters">
          <label className="convocatorias-config__filter-field">
            Período
            <select value={periodoFilter} onChange={(event) => setPeriodoFilter(event.target.value)}>
              {periodos.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo === 'TODOS' ? 'Todos' : periodo}
                </option>
              ))}
            </select>
          </label>

          <label className="convocatorias-config__filter-field">
            Vigente
            <select
              value={vigenteFilter}
              onChange={(event) => setVigenteFilter(event.target.value as VigenteFilter)}
            >
              <option value="TODOS">Todos</option>
              <option value="VIGENTE">Vigentes</option>
              <option value="CERRADA">Cerradas</option>
            </select>
          </label>
        </div>

        {feedback ? <p className="convocatorias-config__feedback">{feedback}</p> : null}

        {isLoading ? <p className="convocatorias-config__status">Cargando convocatorias...</p> : null}

        {!isLoading && error ? (
          <div className="convocatorias-config__status convocatorias-config__status--error">
            <p>{error}</p>
            <button
              type="button"
              className="convocatorias-config__retry"
              onClick={() => loadConvocatorias()}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && sections.length === 0 ? (
          <p className="convocatorias-config__status">
            No hay convocatorias para los filtros seleccionados.
          </p>
        ) : null}

        {!isLoading && !error && sections.length > 0 ? (
          <div className="convocatorias-config__sections">
            {sections.map((section) => (
              <article key={section.programaId} className="convocatorias-config__section-card">
                <header className="convocatorias-config__section-header">
                  <h2>{section.programaLabel}</h2>
                  <p>{section.programaRaw}</p>
                </header>

                <div className="convocatorias-config__table-wrap">
                  <table className="convocatorias-config__table">
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th>Cupos</th>
                        <th>Fecha inicio</th>
                        <th>Fecha fin</th>
                        <th>Vigente</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item) => {
                        const convocatoriaVigente = isConvocatoriaVigente(item)

                        return (
                          <tr key={item.id}>
                          <td>{item.periodo}</td>
                          <td>{item.cupos}</td>
                          <td>{formatFecha(item.fechaInicio)}</td>
                          <td>{formatFecha(item.fechaFin)}</td>
                          <td>
                            <span
                              className={`convocatorias-config__badge ${
                                convocatoriaVigente
                                  ? 'convocatorias-config__badge--vigente'
                                  : 'convocatorias-config__badge--cerrada'
                              }`}
                            >
                              {convocatoriaVigente ? 'VIGENTE' : 'CERRADA'}
                            </span>
                          </td>
                          <td>
                            <span className="convocatorias-config__observaciones">
                              {item.observaciones?.trim() || '-'}
                            </span>
                          </td>
                          <td>
                            <div className="convocatorias-config__actions">
                              <button
                                type="button"
                                className="convocatorias-config__action convocatorias-config__action--ghost"
                                onClick={() =>
                                  navigate(`/admisiones/convocatoria/${item.id}`, {
                                    state: {
                                      programaId: item.programaId,
                                      programaNombre: resolveProgramaLabel(item.programa),
                                      periodoLabel: item.periodo,
                                      periodoAcademico: item.periodo,
                                      cupos: item.cupos,
                                    },
                                  })
                                }
                              >
                                Ver inscripciones
                              </button>
                              {convocatoriaVigente ? (
                                <button
                                  type="button"
                                  className="convocatorias-config__action"
                                  onClick={() => handleCloseConvocatoria(item)}
                                  disabled={isRefreshing}
                                >
                                  Cerrar
                                </button>
                              ) : null}
                            </div>
                          </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <CreateConvocatoriaModal
        open={isCreateModalOpen}
        convocatorias={convocatorias}
        onClose={() => setIsCreateModalOpen(false)}
        onRefreshConvocatorias={() => loadConvocatorias(true)}
        onSuccess={(message) => setFeedback(message)}
      />
    </ModuleLayout>
  )
}

export default ConvocatoriasAdmisionConfigPage
