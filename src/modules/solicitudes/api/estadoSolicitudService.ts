import { httpGet } from '../../../shared/http/httpClient'
import type { ApiResponse, EstadoSolicitudDto } from './types'
import {
  type EstadoSolicitudCatalogItem,
  type EstadoSolicitudSigla,
  ESTADOS_SOLICITUD_SIGLAS,
  setEstadoSolicitudCatalog,
} from '../utils/estadoSolicitud'

const isEstadoSolicitudSigla = (value: string): value is EstadoSolicitudSigla => {
  return ESTADOS_SOLICITUD_SIGLAS.includes(value as EstadoSolicitudSigla)
}

const toCatalogItem = (estado: EstadoSolicitudDto): EstadoSolicitudCatalogItem | null => {
  const sigla = estado.sigla?.trim().toUpperCase()

  if (!sigla || !isEstadoSolicitudSigla(sigla)) {
    return null
  }

  const label = estado.nombre?.trim() || sigla
  return {
    id: estado.id,
    sigla,
    label,
  }
}

export async function getEstadosSolicitudCatalog(): Promise<EstadoSolicitudCatalogItem[]> {
  const response = await httpGet<ApiResponse<EstadoSolicitudDto[]>>('/sapp/estadosSolicitud')

  if (!response.ok) {
    throw new Error(response.message || 'No fue posible cargar los estados de solicitud.')
  }

  const catalog = (response.data ?? []).map(toCatalogItem).filter((estado): estado is EstadoSolicitudCatalogItem => !!estado)
  setEstadoSolicitudCatalog(catalog)

  return catalog
}
