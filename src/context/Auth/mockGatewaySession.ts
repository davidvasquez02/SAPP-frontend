import type { AuthSession } from './types'

export const ENABLE_GATEWAY_AUTH_MOCK = true

export const getMockGatewayAdminSession = (): AuthSession => ({
  kind: 'SAPP',
  accessToken: 'NO_TOKEN',
  issuedAt: Math.floor(Date.now() / 1000),
  user: {
    id: 1,
    username: 'admin-gateway-mock',
    roles: ['ADMIN'],
    persona: {
      id: 1,
      tipoDocumento: 'CC',
      numeroDocumento: '0000000000',
      nombre1: 'Administrador',
      nombre2: '',
      apellido1: 'SAPP',
      apellido2: 'Mock',
      emailPersonal: null,
      emailInstitucional: 'admin.gateway.mock@uis.edu.co',
      telefono: null,
    },
    estudiante: null,
    nombreCompleto: 'Administrador SAPP Mock',
    programa: 'EISI - UIS',
    email: 'admin.gateway.mock@uis.edu.co',
    authId: 1,
    activo: true,
    lastLogin: new Date().toISOString(),
  },
})
