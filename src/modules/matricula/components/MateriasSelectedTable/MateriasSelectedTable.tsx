import type { MateriaSeleccionada } from '../../types'
import { getAsignaturaEstadoLabel } from '../../utils/matriculaPresentation'
import './MateriasSelectedTable.css'

type MateriasSelectedTableProps = {
  selected: MateriaSeleccionada[]
  onRemove: (id: number) => void
  disabled?: boolean
  readOnlyView?: boolean
  hideActionColumn?: boolean
}

const MateriasSelectedTable = ({
  selected,
  onRemove,
  disabled = false,
  readOnlyView = false,
  hideActionColumn = false,
}: MateriasSelectedTableProps) => {
  if (selected.length === 0) {
    return <p className="materias-selected-table__empty">Aún no has agregado materias.</p>
  }

  return (
    <div className="materias-selected-table__wrapper sapp-table-shell">
      <table className="materias-selected-table sapp-table">
        <thead>
          <tr>
            <th>Materia</th>
            <th>Código</th>
            <th>Nivel</th>
            {readOnlyView || hideActionColumn ? <th>Estado</th> : null}
            {readOnlyView || hideActionColumn ? <th>Grupo</th> : null}
            {readOnlyView || hideActionColumn ? <th>Observaciones</th> : null}
            {!readOnlyView && !hideActionColumn ? <th>Acción</th> : null}
          </tr>
        </thead>
        <tbody>
          {selected.map((materia) => (
            <tr key={materia.id}>
              <td data-label="Materia">{materia.nombre}</td>
              <td data-label="Código">{materia.codigo ?? 'Sin código'}</td>
              <td data-label="Nivel">{materia.nivel == null ? 'Electiva' : materia.nivel}</td>
              {readOnlyView || hideActionColumn ? (
                <td data-label="Estado">
                  <span className="materias-selected-table__status">
                    {getAsignaturaEstadoLabel(materia.estado ?? '')}
                  </span>
                </td>
              ) : null}
              {readOnlyView || hideActionColumn ? (
                <td data-label="Grupo">{materia.grupo?.trim() || '—'}</td>
              ) : null}
              {readOnlyView || hideActionColumn ? (
                <td data-label="Observaciones">
                  {materia.observaciones?.trim() ? (
                    <span className="materias-selected-table__observation">
                      {materia.observaciones}
                    </span>
                  ) : '—'}
                </td>
              ) : null}
              {!readOnlyView && !hideActionColumn ? (
                <td data-label="Acción">
                  <button type="button" className="materias-selected-table__remove" disabled={disabled} onClick={() => onRemove(materia.id)}>
                    Eliminar
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MateriasSelectedTable
