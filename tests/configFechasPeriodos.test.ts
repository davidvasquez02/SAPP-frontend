import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const configPeriodosSource = readFileSync('src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx', 'utf8')
const fechasModuleSource = readFileSync('src/pages/FechasModule/FechasModulePage.tsx', 'utf8')

test('crea y actualiza períodos sin solicitar descripción y vuelve al listado', () => {
  assert.doesNotMatch(configPeriodosSource, /Descripción/)
  assert.match(configPeriodosSource, /descripcion: ''/)
  assert.match(configPeriodosSource, /navigate\('\/fechas'\)/)
  assert.doesNotMatch(configPeriodosSource, /await loadData\(\)/)
})

test('evita repetir el título del módulo de fechas', () => {
  assert.match(fechasModuleSource, /<ModuleLayout title="Módulo">/)
  assert.match(fechasModuleSource, /<h1>Fechas académicas<\/h1>/)
  assert.doesNotMatch(fechasModuleSource, /Módulo de fechas académicas/)
})
