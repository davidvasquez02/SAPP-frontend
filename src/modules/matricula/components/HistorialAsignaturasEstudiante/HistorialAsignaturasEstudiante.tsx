import { useEffect, useRef, useState } from 'react'
import { getHistorialAsignaturasEstudiante } from '../../services/matriculaAcademicaService'
import type { HistorialAsignaturaDto } from '../../types'
import { formatBackendDateTime, getAsignaturaEstadoLabel } from '../../utils/matriculaPresentation'
import './HistorialAsignaturasEstudiante.css'

type HistorialAsignaturasEstudianteProps = {
  estudianteId: number
  matriculaId?: number
  active?: boolean
}

const HistorialAsignaturasEstudiante = ({ estudianteId, matriculaId, active = true }: HistorialAsignaturasEstudianteProps) => {
  const [historial, setHistorial] = useState<HistorialAsignaturaDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!active || loadedRef.current) return
    let ignore = false

    getHistorialAsignaturasEstudiante(estudianteId)
      .then((data) => {
        if (ignore) return
        setHistorial(data)
        loadedRef.current = true
      })
      .catch((err: unknown) => {
        if (ignore) return
        loadedRef.current = true
        setError(err instanceof Error ? err.message : 'No fue posible cargar el historial de materias.')
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => { ignore = true }
  }, [active, estudianteId])

  if (!active) return null
  if (isLoading) return <p className="historial-asignaturas__status">Cargando historial de materias…</p>
  if (error) return <p className="historial-asignaturas__status historial-asignaturas__status--error">{error}</p>

  const filas = (matriculaId == null ? historial : historial.filter((fila) => fila.matriculaId === matriculaId))
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  if (filas.length === 0) {
    return <p className="historial-asignaturas__status">No hay historial de materias registrado.</p>
  }

  return (
    <div className="historial-asignaturas__wrapper sapp-table-shell">
      <table className="historial-asignaturas sapp-table">
        <thead>
          <tr>
            <th>Materia</th>
            {matriculaId == null ? <th>Periodo</th> : null}
            <th>Cambio</th>
            <th>Fecha</th>
            <th>Responsable</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, index) => (
            <tr key={`${fila.matriculaId}-${fila.asignaturaId}-${fila.fecha}-${index}`}>
              <td data-label="Materia">{fila.asignaturaNombre}{fila.asignaturaCodigo ? ` (${fila.asignaturaCodigo})` : ''}</td>
              {matriculaId == null ? <td data-label="Periodo">{fila.periodoAcademico}</td> : null}
              <td data-label="Cambio">
                {fila.estadoAnterior ? `${getAsignaturaEstadoLabel(fila.estadoAnterior)} → ` : ''}
                {getAsignaturaEstadoLabel(fila.estadoNuevo)}
              </td>
              <td data-label="Fecha">{formatBackendDateTime(fila.fecha)}</td>
              <td data-label="Responsable">{fila.responsable}</td>
              <td data-label="Detalle">{fila.detalle?.trim() || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default HistorialAsignaturasEstudiante
