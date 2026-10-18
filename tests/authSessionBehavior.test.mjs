import assert from 'node:assert/strict'
import test from 'node:test'
import { apiHarness } from './helpers/apiHarness.mjs'

test('sesión y roles: recuperación, compatibilidad y permisos sin escalamiento', async t => {
  const api = await apiHarness(t)
  const session = await api.load('/src/modules/auth/session/sessionStore.ts')
  const roles = await api.load('/src/modules/auth/roles/roleUtils.ts')
  assert.equal(session.getSession(), null)
  assert.equal(session.getToken(), null)
  api.storage.setItem('SAPP_AUTH_SESSION', '{json roto')
  api.storage.setItem('session', JSON.stringify({ accessToken: 'legado' }))
  assert.equal(session.getToken(), 'legado')
  api.storage.setItem('session', JSON.stringify({ accessToken: 'cambiado' }))
  assert.equal(session.getToken(), 'legado', 'la sesión recuperada permanece en caché')
  session.clearSession()
  assert.equal(api.storage.getItem('session'), null)
  for (const accessToken of ['NO_TOKEN', '', undefined]) {
    session.saveSession({ accessToken })
    assert.equal(session.getToken(), null)
  }
  session.saveSession({ accessToken: 'actual' })
  assert.equal(JSON.parse(api.storage.getItem('SAPP_AUTH_SESSION')).accessToken, 'actual')
  assert.equal(session.getToken(), 'actual')
  session.clearSession()

  assert.deepEqual(roles.normalizeRoles([' docente ', 'PROFESOR', 'DOCENTE_POSGRADOS', '', ' secretaria ']), ['DOCENTE_POSGRADOS', 'SECRETARIA_POSGRADOS'])
  for (const [alias, expected] of [['ADMIN_SAPP', 'ADMIN_POSGRADOS'], ['ADMIN', 'ADMIN_POSGRADOS'], ['COORDINADOR', 'COORDINADOR_POSGRADOS'], ['ESTUDIANTE', 'ESTUDIANTE_POSGRADOS']]) {
    assert.equal(roles.normalizeRole(alias), expected)
  }
  assert.equal(roles.hasAnyRole(['ESTUDIANTE'], ['ADMIN', 'COORDINADOR']), false)
  assert.equal(roles.hasAnyRole([], ['ESTUDIANTE']), false)
  assert.equal(roles.hasAnyRole(['ADMIN'], []), false)
  assert.equal(roles.hasAnyRole(['SECRETARIA'], ['SECRETARIA_POSGRADOS']), true)
  assert.equal(roles.isProfesor([' docente ']), true)
  assert.equal(roles.isProfesor(['ESTUDIANTE']), false)
  assert.equal(roles.formatRoleLabel('COORDINADOR_POSGRADOS'), 'COORDINADOR')
  assert.equal(roles.formatRoleLabel('ROL_EXTERNO'), 'ROL EXTERNO')
})
