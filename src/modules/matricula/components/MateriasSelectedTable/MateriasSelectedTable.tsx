import type { MateriaSeleccionada } from '../../types'
import './MateriasSelectedTable.css'

type MateriasSelectedTableProps = {
  selected: MateriaSeleccionada[]
  onGrupoChange: (id: number, grupo: string) => void
  onRemove: (id: number) => void
}

const MateriasSelectedTable = ({ selected, onGrupoChange, onRemove }: MateriasSelectedTableProps) => {
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
            <th>Grupo</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {selected.map((materia) => (
            <tr key={materia.id}>
              <td>{materia.nombre}</td>
              <td>{materia.codigo ?? 'Sin código'}</td>
              <td>{materia.nivel}</td>
              <td>
                <input
                  type="text"
                  value={materia.grupo}
                  placeholder="Ej: A1"
                  onChange={(event) => onGrupoChange(materia.id, event.target.value)}
                />
              </td>
              <td>
                <button type="button" className="materias-selected-table__remove" onClick={() => onRemove(materia.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MateriasSelectedTable
