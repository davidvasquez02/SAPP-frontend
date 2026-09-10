import type { TipoSolicitudDto } from '../../api/types'
import { formatTipoSolicitudLabel } from '../../utils/tipoSolicitudLabel'
import type { EstadoSolicitudCatalogItem } from '../../utils/estadoSolicitud'
import './SolicitudesFiltersBar.css'

type SolicitudesFiltersValue = {
  estadoId: number | null
  tipoSolicitudId: number | null
}

interface SolicitudesFiltersBarProps extends SolicitudesFiltersValue {
  estadosCatalog: EstadoSolicitudCatalogItem[]
  tiposSolicitud: TipoSolicitudDto[]
  onChange: (next: SolicitudesFiltersValue) => void
  disabled?: boolean
}


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
  estadosCatalog,
  tiposSolicitud,
  onChange,
  disabled = false,
}: SolicitudesFiltersBarProps) => {
  const canClear = estadoId !== null || tipoSolicitudId !== null

  return (
    <div className="solicitudes-filters-bar" aria-live="polite">
      <div className="solicitudes-filters-bar__filters">
        <label className="solicitudes-filters-bar__field sapp-filter-field">
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
            {estadosCatalog.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.label}
              </option>
            ))}
          </select>
        </label>

        <label className="solicitudes-filters-bar__field sapp-filter-field">
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
            {tiposSolicitud.map((tipo) => {
              const formattedLabel = formatTipoSolicitudLabel(tipo.nombre)

              return (
                <option key={tipo.id} value={tipo.id}>
                  {formattedLabel || tipo.nombre || 'Sin tipo de solicitud'}
                </option>
              )
            })}
          </select>
        </label>
      </div>

      <div className="solicitudes-filters-bar__actions sapp-filters-actions">
        <button
          type="button"
          className="solicitudes-filters-bar__clear-button sapp-filters-clear-button"
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
