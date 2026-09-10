import type { MateriaSeleccionada } from '../../types'
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
            {!readOnlyView && !hideActionColumn ? <th>Acción</th> : null}
          </tr>
        </thead>
        <tbody>
          {selected.map((materia) => (
            <tr key={materia.id}>
              <td>{materia.nombre}</td>
              <td>{materia.codigo ?? 'Sin código'}</td>
              <td>{materia.nivel}</td>
              {!readOnlyView && !hideActionColumn ? (
                <td>
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
