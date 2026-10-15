import assert from 'node:assert/strict'
import test from 'node:test'
import { actualizarDirectorEnSession } from '../src/modules/perfil/utils/directorGradoSession.ts'
import type { AuthSession } from '../src/context/Auth/types.ts'

test('actualiza ambas proyecciones del estudiante conservando sesión y otros datos', () => {
  const estudiante = { id: 42, codigoEstudianteUis: '20260001', directorTg: null }
  const session = {
    kind: 'SAPP', accessToken: 'NO_TOKEN', issuedAt: 100,
    user: { id: 10, roles: ['ESTUDIANTE_POSGRADOS'], estudiante, detalle: { estudiante, persona: { id: 10 } } },
  } as unknown as AuthSession
  const asignacion = {
    estudianteId: 42, puedeAsignar: false, grupo: { id: 5, nombre: 'Grupo de prueba' },
    director: { id: 20, nombreCompleto: null, correo: null },
  }
  const result = actualizarDirectorEnSession(session, asignacion)!
  assert.equal(result.accessToken, session.accessToken)
  assert.equal(result.issuedAt, session.issuedAt)
  assert.equal(result.user.id, 10)
  assert.equal(result.user.estudiante?.codigoEstudianteUis, '20260001')
  assert.deepEqual(result.user.estudiante?.directorTg, asignacion.director)
  assert.deepEqual(result.user.estudiante?.grupoInvestigacion, asignacion.grupo)
  assert.equal(result.user.estudiante, result.user.detalle.estudiante)
  assert.equal(result.user.detalle.persona, session.user.detalle.persona)
  assert.equal(session.user.estudiante?.directorTg, null)
})

test('ignora asignaciones de otro estudiante y sesiones ausentes', () => {
  const session = { user: { estudiante: { id: 42 } } } as AuthSession
  const asignacion = { estudianteId: 99, puedeAsignar: true, grupo: null, director: null }
  assert.equal(actualizarDirectorEnSession(session, asignacion), session)
  assert.equal(actualizarDirectorEnSession(null, asignacion), null)
})
