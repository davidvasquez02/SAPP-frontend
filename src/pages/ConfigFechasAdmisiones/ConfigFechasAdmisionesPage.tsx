import { useCallback, useEffect, useMemo, useState } from 'react'
import { ModuleLayout } from '../../components'
import { savePeriodoAcademicoFecha } from '../../modules/configFechas/api/periodoAcademicoFechaService'
import { getPeriodosAcademicos } from '../../modules/configFechas/api/periodoAcademicoService'
import type { PeriodoAcademicoDto } from '../../modules/configFechas/api/types'
import { TIPO_TRAMITE_ADMISIONES } from '../../modules/configFechas/constants'
import {
  getConfigByPeriodo,
  loadConfigs,
  type ConfigFechasItem,
  upsertConfig,
} from '../../modules/configFechas/storage/configFechasStorage'
import './ConfigFechasAdmisionesPage.css'

type FormState = {
  periodoId: number | null
  fechaInicio: string
  fechaFin: string
  descripcion: string
}

const EMPTY_FORM: FormState = {
  periodoId: null,
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
}

const formatDateLabel = (value: string | null) => {
  if (!value) {
    return '-'
  }

  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

const getDefaultDatesByPeriodo = (periodo: PeriodoAcademicoDto) => {
  if (periodo.fechaInicio && periodo.fechaFin) {
    return {
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
    }
  }

  if (periodo.periodo === 1) {
    return {
      fechaInicio: `${periodo.anio}-01-01`,
      fechaFin: `${periodo.anio}-06-30`,
    }
  }

  return {
    fechaInicio: `${periodo.anio}-07-01`,
    fechaFin: `${periodo.anio}-12-31`,
  }
}

const ConfigFechasAdmisionesPage = () => {
  const [periodos, setPeriodos] = useState<PeriodoAcademicoDto[]>([])
  const [configs, setConfigs] = useState<ConfigFechasItem[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const periodosById = useMemo(() => {
    return new Map(periodos.map((periodo) => [periodo.id, periodo]))
  }, [periodos])

  const applyPeriodoValues = useCallback(
    (periodoId: number) => {
      const periodo = periodosById.get(periodoId)
      if (!periodo) {
        return
      }

      const localConfig = getConfigByPeriodo(periodoId)

      if (localConfig) {
        setForm({
          periodoId,
          fechaInicio: localConfig.fechaInicio,
          fechaFin: localConfig.fechaFin,
          descripcion: localConfig.descripcion,
        })
        return
      }

      const defaults = getDefaultDatesByPeriodo(periodo)

      setForm({
        periodoId,
        fechaInicio: defaults.fechaInicio,
        fechaFin: defaults.fechaFin,
        descripcion: '',
      })
    },
    [periodosById]
  )

  useEffect(() => {
    const fetchPeriodos = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getPeriodosAcademicos()
        const sorted = [...data].sort((a, b) => {
          if (a.anio !== b.anio) {
            return b.anio - a.anio
          }

          return b.periodo - a.periodo
        })

        setPeriodos(sorted)
        const storedConfigs = loadConfigs()
        setConfigs(storedConfigs)

        if (sorted.length > 0) {
          const firstPeriodo = sorted[0]
          const localConfig = getConfigByPeriodo(firstPeriodo.id)

          if (localConfig) {
            setForm({
              periodoId: firstPeriodo.id,
              fechaInicio: localConfig.fechaInicio,
              fechaFin: localConfig.fechaFin,
              descripcion: localConfig.descripcion,
            })
          } else {
            const defaults = getDefaultDatesByPeriodo(firstPeriodo)
            setForm({
              periodoId: firstPeriodo.id,
              fechaInicio: defaults.fechaInicio,
              fechaFin: defaults.fechaFin,
              descripcion: '',
            })
          }
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No fue posible cargar los periodos académicos.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchPeriodos()
  }, [])

  const handlePeriodoChange = (periodoId: number) => {
    setError(null)
    setFeedback(null)
    applyPeriodoValues(periodoId)
  }

  const handleClear = () => {
    if (!form.periodoId) {
      setForm(EMPTY_FORM)
      return
    }

    applyPeriodoValues(form.periodoId)
    setError(null)
    setFeedback(null)
  }

  const validateForm = (): string | null => {
    if (!form.periodoId) {
      return 'Debe seleccionar un periodo académico.'
    }

    if (!form.fechaInicio || !form.fechaFin) {
      return 'Debe seleccionar la fecha de inicio y la fecha de fin.'
    }

    if (form.fechaInicio > form.fechaFin) {
      return 'La fecha de inicio no puede ser mayor que la fecha de fin.'
    }

    if (!form.descripcion.trim() || form.descripcion.trim().length < 5) {
      return 'La descripción es obligatoria y debe tener al menos 5 caracteres.'
    }

    return null
  }

  const handleSave = async () => {
    setError(null)
    setFeedback(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!form.periodoId) {
      return
    }

    const periodo = periodosById.get(form.periodoId)
    if (!periodo) {
      setError('No se encontró el periodo seleccionado.')
      return
    }

    setIsSaving(true)

    try {
      await savePeriodoAcademicoFecha({
        periodoId: form.periodoId,
        tipoTramiteId: TIPO_TRAMITE_ADMISIONES,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        descripcion: form.descripcion.trim(),
      })

      upsertConfig({
        periodoId: form.periodoId,
        periodoLabel: periodo.anioPeriodo,
        tipoTramiteId: TIPO_TRAMITE_ADMISIONES,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        descripcion: form.descripcion.trim(),
        updatedAt: new Date().toISOString(),
      })

      setConfigs(loadConfigs())
      setFeedback('Fechas guardadas correctamente')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible guardar la configuración de fechas.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ModuleLayout title="Configuración de fechas — Admisiones">
      <section className="config-fechas-admisiones">
        <header className="config-fechas-admisiones__header">
          <div>
            <h1>Configuración de fechas por semestre</h1>
            <p>Defina el rango de fechas de admisiones para cada periodo académico.</p>
          </div>
        </header>

        <div className="config-fechas-admisiones__form-card">
          <div className="config-fechas-admisiones__form-grid">
            <label className="config-fechas-admisiones__field config-fechas-admisiones__field--full">
              Periodo académico
              <select
                value={form.periodoId ?? ''}
                onChange={(event) => handlePeriodoChange(Number(event.target.value))}
                disabled={isLoading || periodos.length === 0}
              >
                {periodos.length === 0 ? <option value="">Sin periodos disponibles</option> : null}
                {periodos.map((periodo) => {
                  const hasDates = Boolean(periodo.fechaInicio && periodo.fechaFin)
                  const optionLabel = hasDates
                    ? `${periodo.anioPeriodo} (${periodo.fechaInicio} → ${periodo.fechaFin})`
                    : periodo.anioPeriodo

                  return (
                    <option key={periodo.id} value={periodo.id}>
                      {optionLabel}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="config-fechas-admisiones__field">
              Fecha inicio
              <input
                type="date"
                value={form.fechaInicio}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fechaInicio: event.target.value }))
                }
              />
            </label>

            <label className="config-fechas-admisiones__field">
              Fecha fin
              <input
                type="date"
                value={form.fechaFin}
                onChange={(event) => setForm((current) => ({ ...current, fechaFin: event.target.value }))}
              />
            </label>

            <label className="config-fechas-admisiones__field config-fechas-admisiones__field--full">
              Descripción
              <textarea
                rows={3}
                value={form.descripcion}
                onChange={(event) =>
                  setForm((current) => ({ ...current, descripcion: event.target.value }))
                }
                placeholder="Ej. Periodo de recepción de documentos de admisión"
              />
            </label>
          </div>

          <div className="config-fechas-admisiones__actions">
            <button type="button" onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              className="config-fechas-admisiones__ghost"
              onClick={handleClear}
              disabled={isSaving}
            >
              Limpiar
            </button>
          </div>

          {error ? <p className="config-fechas-admisiones__alert config-fechas-admisiones__alert--error">{error}</p> : null}
          {feedback ? (
            <p className="config-fechas-admisiones__alert config-fechas-admisiones__alert--success">{feedback}</p>
          ) : null}
        </div>

        <div className="config-fechas-admisiones__table-card">
          <h2>Configuraciones guardadas</h2>

          {configs.length === 0 ? (
            <p className="config-fechas-admisiones__status">Aún no hay configuraciones guardadas.</p>
          ) : (
            <div className="config-fechas-admisiones__table-wrap sapp-table-shell">
              <table className="config-fechas-admisiones__table sapp-table">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Fecha inicio</th>
                    <th>Fecha fin</th>
                    <th>Descripción</th>
                    <th>Actualizado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((item) => (
                    <tr key={item.periodoId}>
                      <td>{item.periodoLabel}</td>
                      <td>{formatDateLabel(item.fechaInicio)}</td>
                      <td>{formatDateLabel(item.fechaFin)}</td>
                      <td>{item.descripcion}</td>
                      <td>{new Date(item.updatedAt).toLocaleString('es-CO')}</td>
                      <td>
                        <button type="button" onClick={() => handlePeriodoChange(item.periodoId)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </ModuleLayout>
  )
}

export default ConfigFechasAdmisionesPage
