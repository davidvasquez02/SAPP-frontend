import { getEstadoSolicitudLabel, normalizeEstadoSolicitud } from '../../utils/estadoSolicitud'
import './StatusBadge.css'

interface StatusBadgeProps {
  estado: string | null | undefined
  size?: 'sm' | 'md'
}

const STATE_CLASSNAME: Record<ReturnType<typeof normalizeEstadoSolicitud>, string> = {
  ENVIADA: 'enviada',
  EN_REVISION: 'en-revision',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  DEVUELTA: 'devuelta',
  PFIR_DIR_TG: 'en-firma',
  PFIR_COOR_POS: 'en-firma',
  PFIR_CAR_CONT: 'en-firma',
  UNKNOWN: 'unknown',
}

const StatusBadge = ({ estado, size = 'md' }: StatusBadgeProps) => {
  const normalized = normalizeEstadoSolicitud(estado)

  return (
    <span className={`status-badge status-badge--${size} status-badge--${STATE_CLASSNAME[normalized]}`}>
      {getEstadoSolicitudLabel(estado)}
    </span>
  )
}

export default StatusBadge
