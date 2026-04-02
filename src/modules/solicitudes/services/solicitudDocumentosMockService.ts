import { solicitudDocumentosById } from '../mock/solicitudDocumentos.mock'
import type { SolicitudDocumentoAdjuntoDto } from '../types/documentosAdjuntos'

const delay = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms)
})

export async function fetchSolicitudDocumentos(solicitudId: number): Promise<SolicitudDocumentoAdjuntoDto[]> {
  await delay(150)
  return solicitudDocumentosById[solicitudId] ?? []
}
