import type { SolicitudDocumentoRequirement } from '../types/solicitudDocumentosTypes'

const documentosPorTipo: Record<number, SolicitudDocumentoRequirement[]> = {
  1: [
    { id: 101, nombre: 'Carta de solicitud', obligatorio: true },
    { id: 102, nombre: 'Cronograma actualizado', obligatorio: true },
    { id: 103, nombre: 'Aval director', obligatorio: false },
  ],
  2: [
    { id: 201, nombre: 'Certificado de notas', obligatorio: true },
    { id: 202, nombre: 'Contenido programático', obligatorio: true },
    { id: 203, nombre: 'Recibo pago estudio', obligatorio: false },
  ],
  3: [
    { id: 301, nombre: 'Carta cambio de director', obligatorio: true },
    { id: 302, nombre: 'Aceptación nuevo director', obligatorio: true },
    { id: 303, nombre: 'Aval director actual', obligatorio: false },
  ],
}

export function getMockDocumentosByTipo(tipoSolicitudId: number): SolicitudDocumentoRequirement[] {
  return documentosPorTipo[tipoSolicitudId] ?? []
}
