import type { TipoSolicitudDto } from '../../api/types'
import './SolicitudesFiltersBar.css'

type SolicitudesFiltersValue = {
  estadoId: number | null
  tipoSolicitudId: number | null
}

interface SolicitudesFiltersBarProps extends SolicitudesFiltersValue {
  tiposSolicitud: TipoSolicitudDto[]
  onChange: (next: SolicitudesFiltersValue) => void
  disabled?: boolean
}

const ESTADOS = [
  { id: 1, label: 'REGISTRADA' },
  { id: 2, label: 'EN ESTUDIO' },
  { id: 3, label: 'APROBADA' },
  { id: 4, label: 'RECHAZADA' },
] as const

const parseNullableNumber = (value: string): number | null => {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const SolicitudesFiltersBar = ({
  estadoId,
  tipoSolicitudId,
  tiposSolicitud,
  onChange,
  disabled = false,
}: SolicitudesFiltersBarProps) => {
  const canClear = estadoId !== null || tipoSolicitudId !== null

  return (
    <div className="solicitudes-filters-bar" aria-live="polite">
      <div className="solicitudes-filters-bar__filters">
        <label className="field label border solicitudes-filters-bar__field">
          <span>Estado</span>
          <select
            disabled={disabled}
            value={estadoId ?? ''}
            onChange={(event) =>
              onChange({
                estadoId: parseNullableNumber(event.target.value),
                tipoSolicitudId,
              })
            }
          >
            <option value="">Todos</option>
            {ESTADOS.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field label border solicitudes-filters-bar__field">
          <span>Tipo de solicitud</span>
          <select
            disabled={disabled}
            value={tipoSolicitudId ?? ''}
            onChange={(event) =>
              onChange({
                estadoId,
                tipoSolicitudId: parseNullableNumber(event.target.value),
              })
            }
          >
            <option value="">Todos</option>
            {tiposSolicitud.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.codigoNombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="solicitudes-filters-bar__actions">
        <button
          type="button"
          className="solicitudes-filters-bar__clear-button"
          disabled={disabled || !canClear}
          onClick={() => onChange({ estadoId: null, tipoSolicitudId: null })}
        >
          Limpiar filtros
        </button>

        {disabled && <span className="solicitudes-filters-bar__status">Filtrando...</span>}
      </div>
    </div>
  )
}

export default SolicitudesFiltersBar
