import { normalizeEstadoSolicitud } from '../../utils/estadoSolicitud'
import './StatusBadge.css'

interface StatusBadgeProps {
  estado: string | null | undefined
  size?: 'sm' | 'md'
}

const STATE_CLASSNAME: Record<ReturnType<typeof normalizeEstadoSolicitud>, string> = {
  REGISTRADA: 'registrada',
  'EN ESTUDIO': 'en-estudio',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  UNKNOWN: 'unknown',
}

const StatusBadge = ({ estado, size = 'md' }: StatusBadgeProps) => {
  const normalized = normalizeEstadoSolicitud(estado)
  const label = normalized === 'UNKNOWN' ? 'DESCONOCIDO' : normalized

  return (
    <span className={`status-badge status-badge--${size} status-badge--${STATE_CLASSNAME[normalized]}`}>{label}</span>
  )
}

export default StatusBadge
