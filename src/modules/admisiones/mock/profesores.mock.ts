export type ProfesorOption = {
  id: number
  nombre: string
  email?: string
}

export const profesoresMock: ProfesorOption[] = [
  { id: 10, nombre: 'Mario Mendoza', email: 'mario@uis.edu.co' },
  { id: 11, nombre: 'Jorge Borges', email: 'jorge@uis.edu.co' },
  { id: 12, nombre: 'Xabi Alonso', email: 'xabi@uis.edu.co' },
  { id: 13, nombre: 'Andres Valenzuela', email: 'andres@uis.edu.co' },
]
