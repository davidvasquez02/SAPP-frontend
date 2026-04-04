import type { MateriaSeleccionada } from '../../types'
import './MateriasSelectedTable.css'

type MateriasSelectedTableProps = {
  selected: MateriaSeleccionada[]
  onRemove: (id: number) => void
}

const MateriasSelectedTable = ({ selected, onRemove }: MateriasSelectedTableProps) => {
  if (selected.length === 0) {
    return <p className="materias-selected-table__empty">Aún no has agregado materias.</p>
  }

  return (
    <div className="materias-selected-table__wrapper">
      <table className="materias-selected-table">
        <thead>
          <tr>
            <th>Materia</th>
            <th>Código</th>
            <th>Nivel</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {selected.map((materia) => (
            <tr key={materia.id}>
              <td>{materia.nombre}</td>
              <td>{materia.codigo}</td>
              <td>{materia.nivel}</td>
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
