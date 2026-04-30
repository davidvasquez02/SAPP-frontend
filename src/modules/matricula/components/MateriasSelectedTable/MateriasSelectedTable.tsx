import type { MateriaSeleccionada } from '../../types'
import './MateriasSelectedTable.css'

type MateriasSelectedTableProps = {
  selected: MateriaSeleccionada[]
  onGrupoChange: (id: number, grupo: string) => void
  onRemove: (id: number) => void
  invalidGrupoIds?: number[]
  disabled?: boolean
  readOnlyView?: boolean
}

const MateriasSelectedTable = ({
  selected,
  onGrupoChange,
  onRemove,
  invalidGrupoIds = [],
  disabled = false,
  readOnlyView = false,
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
            <th>Grupo</th>
            {!readOnlyView ? <th>Acción</th> : null}
          </tr>
        </thead>
        <tbody>
          {selected.map((materia) => (
            <tr key={materia.id}>
              <td>{materia.nombre}</td>
              <td>{materia.codigo ?? 'Sin código'}</td>
              <td>{materia.nivel}</td>
              <td>
                {readOnlyView ? (
                  materia.grupo || '—'
                ) : (
                  <input
                    type="text"
                    value={materia.grupo}
                    placeholder="Ej: A1"
                    maxLength={2}
                    className={invalidGrupoIds.includes(materia.id) ? 'materias-selected-table__grupo-input materias-selected-table__grupo-input--error' : 'materias-selected-table__grupo-input'}
                    disabled={disabled}
                    onChange={(event) => onGrupoChange(materia.id, event.target.value)}
                  />
                )}
              </td>
              {!readOnlyView ? (
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
