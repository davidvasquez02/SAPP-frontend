export type ProfesorOption = {
  uuid: string
  id: number | null
  existeEnSapp: boolean
  nombre: string
  email?: string
}

export const profesoresMock: ProfesorOption[] = [
  { uuid: '00000000-0000-0000-0000-000000000010', id: 10, existeEnSapp: true, nombre: 'Mario Mendoza', email: 'mario@uis.edu.co' },
  { uuid: '00000000-0000-0000-0000-000000000011', id: 11, existeEnSapp: true, nombre: 'Jorge Borges', email: 'jorge@uis.edu.co' },
  { uuid: '00000000-0000-0000-0000-000000000012', id: 12, existeEnSapp: true, nombre: 'Xabi Alonso', email: 'xabi@uis.edu.co' },
  { uuid: '00000000-0000-0000-0000-000000000013', id: 13, existeEnSapp: true, nombre: 'Andres Valenzuela', email: 'andres@uis.edu.co' },
]
