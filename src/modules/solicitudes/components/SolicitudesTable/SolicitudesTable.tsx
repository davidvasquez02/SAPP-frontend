import type { SolicitudTableRow } from '../../types'
import './SolicitudesTable.css'

interface SolicitudesTableProps {
  rows: SolicitudTableRow[]
  mode: 'ESTUDIANTE' | 'COORDINADOR'
  onRowClick?: (row: SolicitudTableRow) => void
}

const formatDate = (value: string | null) => {
  if (!value) {
    return '—'
  }

  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const SolicitudesTable = ({ rows, mode, onRowClick }: SolicitudesTableProps) => {
  return (
    <div className="solicitudes-table__container">
      <table className="solicitudes-table">
        <thead>
          <tr>
            <th>ID</th>
            {mode === 'COORDINADOR' && <th>Estudiante</th>}
            {mode === 'COORDINADOR' && <th>Código UIS</th>}
            <th>Tipo</th>
            <th>Estado</th>
            <th>Fecha registro</th>
            <th>Fecha resolución</th>
            <th>Programa</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isClickable = Boolean(onRowClick)

            return (
              <tr
                key={row.id}
                className={isClickable ? 'solicitudes-table__row--clickable' : ''}
                onClick={() => onRowClick?.(row)}
              >
                <td>{row.id}</td>
                {mode === 'COORDINADOR' && <td>{row.estudiante ?? '—'}</td>}
                {mode === 'COORDINADOR' && <td>{row.codigoEstudianteUis ?? '—'}</td>}
                <td>
                  <strong>{row.tipoSolicitudCodigo}</strong>
                  <br />
                  <span>{row.tipoSolicitud}</span>
                </td>
                <td>
                  <span className="solicitudes-table__badge">{row.estado}</span>
                </td>
                <td>{formatDate(row.fechaRegistro)}</td>
                <td>{formatDate(row.fechaResolucion)}</td>
                <td>{row.programaAcademico}</td>
                <td className="solicitudes-table__observaciones">{row.observaciones ?? 'Sin observaciones.'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SolicitudesTable
