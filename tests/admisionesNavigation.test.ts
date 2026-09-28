import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const sidebarPath = new URL('../src/components/Sidebar/Sidebar.tsx', import.meta.url)
const navigationPath = new URL('../src/app/navigationItems.ts', import.meta.url)

test('oculta admisiones al evaluador sin entrevistas y conserva los perfiles administrativos', async () => {
  const navigation = await readFile(navigationPath, 'utf8')

  assert.match(navigation, /ROLES\.PROFESOR, ROLES\.DOCENTE, ROLES\.DIRECTOR/)
  assert.match(navigation, /!canManagePosgrados\(roles\)/)
  assert.match(navigation, /canAccessAdmisiones && \(!isEvaluadorOnly \|\| hasAssignedAdmisiones\)/)
  assert.match(navigation, /ROLES\.COORDINACION/)
  assert.match(navigation, /ROLES\.SECRETARIA/)
  assert.match(navigation, /ROLES\.ADMIN/)
})

test('el menú consulta las entrevistas del evaluador sin mostrar admisiones durante la comprobación', async () => {
  const sidebar = await readFile(sidebarPath, 'utf8')

  assert.match(sidebar, /getEntrevistasPorEvaluador\(evaluatorUserId\)/)
  assert.match(sidebar, /entrevistas\.length > 0/)
  assert.doesNotMatch(sidebar, /getConvocatoriasAdmision/)
  assert.match(sidebar, /hasAssignedAdmisiones === true/)
  assert.match(sidebar, /isEvaluadorAdmision\(roles\) && !canManagePosgrados\(roles\)/)
  assert.match(sidebar, /admisionesAccess\.userId === evaluatorUserId/)
})
