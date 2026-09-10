export type AsignacionEntrevista = {
  convocatoriaId: number
  inscripcionId: number
  nombreAspirante: string
  programa: string
  periodo: string
}

const MOCK_ASSIGNMENTS: Record<string, AsignacionEntrevista[]> = {
  DEFAULT: [
    {
      convocatoriaId: 101,
      inscripcionId: 12001,
      nombreAspirante: 'María Fernanda Rojas',
      programa: 'Maestría en Ingeniería de Sistemas e Informática',
      periodo: '2026-1',
    },
    {
      convocatoriaId: 101,
      inscripcionId: 12002,
      nombreAspirante: 'Carlos Andrés Peña',
      programa: 'Maestría en Ingeniería de Sistemas e Informática',
      periodo: '2026-1',
    },
    {
      convocatoriaId: 102,
      inscripcionId: 13010,
      nombreAspirante: 'Laura Sofía Díaz',
      programa: 'Doctorado en Ciencias de la Computación',
      periodo: '2026-1',
    },
  ],
  'PROFESOR.EJEMPLO': [
    {
      convocatoriaId: 201,
      inscripcionId: 22001,
      nombreAspirante: 'Ana Lucía Cárdenas',
      programa: 'Maestría en Ingeniería de Sistemas e Informática',
      periodo: '2026-1',
    },
    {
      convocatoriaId: 201,
      inscripcionId: 22015,
      nombreAspirante: 'Jorge Elías Torres',
      programa: 'Maestría en Ingeniería de Sistemas e Informática',
      periodo: '2026-1',
    },
    {
      convocatoriaId: 202,
      inscripcionId: 23003,
      nombreAspirante: 'Natalia Gómez',
      programa: 'Doctorado en Ciencias de la Computación',
      periodo: '2026-1',
    },
    {
      convocatoriaId: 202,
      inscripcionId: 23018,
      nombreAspirante: 'Diego Armando Vera',
      programa: 'Doctorado en Ciencias de la Computación',
      periodo: '2026-1',
    },
  ],
  'ID:7': [
    {
      convocatoriaId: 301,
      inscripcionId: 33001,
      nombreAspirante: 'Camilo Rueda',
      programa: 'Maestría en Ingeniería de Sistemas e Informática',
      periodo: '2026-2',
    },
    {
      convocatoriaId: 301,
      inscripcionId: 33004,
      nombreAspirante: 'Diana Milena Cruz',
      programa: 'Maestría en Ingeniería de Sistemas e Informática',
      periodo: '2026-2',
    },
    {
      convocatoriaId: 301,
      inscripcionId: 33012,
      nombreAspirante: 'Sergio Felipe López',
      programa: 'Maestría en Ingeniería de Sistemas e Informática',
      periodo: '2026-2',
    },
  ],
}

const normalizeKey = (value?: string) => (value ?? '').trim().toUpperCase()

export const getAsignacionesByProfesorKey = (key: {
  userId?: number
  username?: string
}): AsignacionEntrevista[] => {
  const usernameKey = normalizeKey(key.username)

  if (usernameKey && MOCK_ASSIGNMENTS[usernameKey]) {
    return MOCK_ASSIGNMENTS[usernameKey]
  }

  if (typeof key.userId === 'number') {
    const idKey = `ID:${key.userId}`
    if (MOCK_ASSIGNMENTS[idKey]) {
      return MOCK_ASSIGNMENTS[idKey]
    }
  }

  return usernameKey ? [] : MOCK_ASSIGNMENTS.DEFAULT
}
