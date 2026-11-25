import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

// Lógica pura del rol activo: se transpila al vuelo para probarla sin el arnés de Vite.
const dir = await mkdtemp(path.join(tmpdir(), 'activerole-'))
for (const nombre of ['roleUtils', 'activeRole']) {
  const fuente = await readFile(new URL(`../src/modules/auth/roles/${nombre}.ts`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(fuente, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  await writeFile(path.join(dir, `${nombre}.mjs`), outputText.replace("from './roleUtils'", "from './roleUtils.mjs'"))
}

const almacenamiento = new Map()
globalThis.localStorage = {
  getItem: (clave) => (almacenamiento.has(clave) ? almacenamiento.get(clave) : null),
  setItem: (clave, valor) => almacenamiento.set(clave, String(valor)),
  removeItem: (clave) => almacenamiento.delete(clave),
}
const m = await import(pathToFileURL(path.join(dir, 'activeRole.mjs')).href)

test('los roles elegibles son los asignados, sin el rol genérico y sin repetidos', () => {
  assert.deepEqual(
    m.getSelectableRoles(['DEFAULT-ROLES-EISI', 'coordinador', 'COORDINADOR_POSGRADOS', 'PROFESOR']),
    ['COORDINADOR_POSGRADOS', 'DOCENTE_POSGRADOS'],
  )
  assert.deepEqual(m.getSelectableRoles(['DEFAULT-ROLES-EISI']), [])
  assert.deepEqual(m.getSelectableRoles(undefined), [])
})

test('el rol activo es el último elegido si sigue asignado; si no, el primero', () => {
  const roles = ['COORDINADOR_POSGRADOS', 'DOCENTE_POSGRADOS']
  assert.equal(m.resolveActiveRole(roles, 'DOCENTE_POSGRADOS'), 'DOCENTE_POSGRADOS')
  assert.equal(m.resolveActiveRole(roles, 'profesor'), 'DOCENTE_POSGRADOS', 'acepta alias antiguos')
  assert.equal(m.resolveActiveRole(roles, 'ADMIN_POSGRADOS'), 'COORDINADOR_POSGRADOS', 'un rol que ya no tiene no se conserva')
  assert.equal(m.resolveActiveRole(roles, null), 'COORDINADOR_POSGRADOS')
  assert.equal(m.resolveActiveRole([], 'DOCENTE_POSGRADOS'), null)
})

test('la sesión solo expone el rol activo, sin modificar la original', () => {
  const base = { token: 't', user: { id: 1, roles: ['COORDINADOR_POSGRADOS', 'DOCENTE_POSGRADOS'] } }
  const activa = m.applyActiveRole(base, 'DOCENTE_POSGRADOS')
  assert.deepEqual(activa.user.roles, ['DOCENTE_POSGRADOS'])
  assert.deepEqual(base.user.roles, ['COORDINADOR_POSGRADOS', 'DOCENTE_POSGRADOS'])
  assert.equal(activa.token, 't')
  assert.equal(m.applyActiveRole(base, null), base, 'sin rol activo se deja la sesión tal cual')
  assert.equal(m.applyActiveRole(null, 'DOCENTE_POSGRADOS'), null)
})

test('cada rol se presenta con un nombre legible', () => {
  assert.equal(m.formatRoleDisplay('COORDINADOR_POSGRADOS'), 'Coordinador')
  assert.equal(m.formatRoleDisplay('DOCENTE_POSGRADOS'), 'Profesor')
  assert.equal(m.formatRoleDisplay('PROFESOR'), 'Profesor')
  assert.equal(m.formatRoleDisplay('ADMIN_POSGRADOS'), 'Administrador')
  assert.equal(m.formatRoleDisplay('DIRECTOR_ESCUELA'), 'Director escuela')
})

test('el rol elegido se recuerda por usuario y se puede borrar', () => {
  m.clearStoredActiveRole()
  assert.equal(m.readStoredActiveRole('pepe'), null)
  m.storeActiveRole('pepe', 'DOCENTE_POSGRADOS')
  assert.equal(m.readStoredActiveRole('pepe'), 'DOCENTE_POSGRADOS')
  assert.equal(m.readStoredActiveRole('maria'), null, 'otro usuario del mismo navegador no hereda la elección')
  m.clearStoredActiveRole()
  assert.equal(m.readStoredActiveRole('pepe'), null)
  almacenamiento.set('SAPP_ACTIVE_ROLE', '{json roto')
  assert.equal(m.readStoredActiveRole('pepe'), null, 'un valor corrupto no rompe nada')
})
