import type { DocumentoRequerido } from '../types'

export const documentosMock: DocumentoRequerido[] = [
  {
    id: 1,
    nombre: 'Matrícula académica',
    obligatorio: true,
    estado: 'EN_REVISION',
    fechaRevision: null,
    observaciones: null,
  },
  {
    id: 2,
    nombre: 'Recibo liquidación',
    obligatorio: true,
    estado: 'APROBADO',
    fechaRevision: '2026-03-10',
    observaciones: null,
  },
  {
    id: 3,
    nombre: 'Pago póliza',
    obligatorio: true,
    estado: 'PENDIENTE',
    fechaRevision: null,
    observaciones: null,
  },
  {
    id: 4,
    nombre: 'Certificado EPS',
    obligatorio: false,
    estado: 'RECHAZADO',
    fechaRevision: '2026-03-09',
    observaciones: 'Documento ilegible',
  },
]
