import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const configPeriodosSource = readFileSync('src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx', 'utf8')
const fechasModuleSource = readFileSync('src/pages/FechasModule/FechasModulePage.tsx', 'utf8')

test('crea y actualiza períodos sin solicitar descripción y vuelve al listado', () => {
  assert.doesNotMatch(configPeriodosSource, /Descripción/)
  assert.match(configPeriodosSource, /descripcion: ''/)
  assert.match(configPeriodosSource, /navigate\(RUTA_CALENDARIO\)/)
  assert.doesNotMatch(configPeriodosSource, /await loadData\(\)/)
})

test('usa un único título para el módulo de fechas', () => {
  assert.match(fechasModuleSource, /<ModuleLayout title="Calendario académico">/)
  assert.doesNotMatch(fechasModuleSource, /<header className="config-module__header">/)
  assert.doesNotMatch(fechasModuleSource, /<h1>Fechas académicas<\/h1>/)
})
