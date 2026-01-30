import type { Convocatoria } from '../types'

export const convocatoriasMock: Convocatoria[] = [
  {
    id: 101,
    programaNombre: 'Maestría en Ing. de Sistemas',
    periodo: { anio: 2026, periodo: 1 },
    fechaInicio: '2026-01-10',
    fechaFin: '2026-02-10',
    estado: 'ABIERTA',
    cupos: 20,
  },
  {
    id: 99,
    programaNombre: 'Maestría en Ing. de Sistemas',
    periodo: { anio: 2025, periodo: 2 },
    fechaInicio: '2025-07-01',
    fechaFin: '2025-08-01',
    estado: 'CERRADA',
    cupos: 18,
  },
  {
    id: 97,
    programaNombre: 'Maestría en Ing. de Sistemas',
    periodo: { anio: 2025, periodo: 1 },
    fechaInicio: '2025-01-15',
    fechaFin: '2025-02-15',
    estado: 'CERRADA',
    cupos: 15,
  },
]
