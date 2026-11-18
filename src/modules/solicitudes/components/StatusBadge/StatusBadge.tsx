import { getEstadoSolicitudLabelPorPrograma, normalizeEstadoSolicitud } from '../../utils/estadoSolicitud'
import './StatusBadge.css'

interface StatusBadgeProps {
  estado: string | null | undefined
  programaAcademico?: string | null
  size?: 'sm' | 'md'
  etiquetaAlternativa?: string
}

const STATE_CLASSNAME: Record<ReturnType<typeof normalizeEstadoSolicitud>, string> = {
  EN_VALIDACION_COORDINACION: 'devuelta',
  ENVIADA: 'enviada-comite',
  EN_REVISION: 'en-revision',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  DEVUELTA: 'devuelta',
  PFIR_DIR_TG: 'en-firma',
  PFIR_COOR_POS: 'en-firma',
  PFIR_CAR_CONT: 'en-firma',
  ENVIADA_CONSEJO: 'enviada-consejo',
  JUR_POR_DESIG: 'en-revision',
  JUR_INVITADO: 'en-revision',
  EN_EVALUACION: 'en-revision',
  CONCEPTOS_REC: 'en-revision',
  EN_AJUSTES: 'en-ajustes',
  SUST_PROGRAMADA: 'en-revision',
  SUSTENTADA: 'aprobada',
  APLAZADA: 'devuelta',
  NO_APROBADA: 'rechazada',
  AJUSTES_RECIB: 'en-revision',
  UNKNOWN: 'unknown',
}

const StatusBadge = ({ estado, programaAcademico, size = 'md', etiquetaAlternativa }: StatusBadgeProps) => {
  const normalized = normalizeEstadoSolicitud(estado)

  return (
    <span className={`status-badge status-badge--${size} status-badge--${STATE_CLASSNAME[normalized]}`}>
      {normalized === 'UNKNOWN' && etiquetaAlternativa
        ? etiquetaAlternativa
        : getEstadoSolicitudLabelPorPrograma(estado, programaAcademico)}
    </span>
  )
}

export default StatusBadge
