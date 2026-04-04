import type { SolicitudTableRow } from '../../types'
import StatusBadge from '../StatusBadge/StatusBadge'
import './SolicitudesTable.css'

interface SolicitudesTableProps {
  rows: SolicitudTableRow[]
  mode: 'ESTUDIANTE' | 'COORDINADOR'
  onRowClick?: (solicitudId: number) => void
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
                onClick={() => onRowClick?.(row.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onRowClick?.(row.id)
                  }
                }}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                <td data-label="ID">{row.id}</td>
                {mode === 'COORDINADOR' && <td data-label="Estudiante">{row.estudiante ?? '—'}</td>}
                {mode === 'COORDINADOR' && <td data-label="Código UIS">{row.codigoEstudianteUis ?? '—'}</td>}
                <td data-label="Tipo">
                  <strong>{row.tipoSolicitudCodigo}</strong>
                  <br />
                  <span>{row.tipoSolicitud}</span>
                </td>
                <td data-label="Estado">
                  <StatusBadge estado={row.estadoSigla || row.estado} size="sm" />
                </td>
                <td data-label="Fecha registro">{formatDate(row.fechaRegistro)}</td>
                <td data-label="Fecha resolución">{formatDate(row.fechaResolucion)}</td>
                <td data-label="Programa">{row.programaAcademico}</td>
                <td className="solicitudes-table__observaciones" data-label="Observaciones">
                  {row.observaciones ?? 'Sin observaciones.'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SolicitudesTable
