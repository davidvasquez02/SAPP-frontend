import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const pageSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')

test('ubica el título del listado inmediatamente antes de los filtros de matrícula', () => {
  assert.match(pageSource, /<ModuleLayout title="Matrículas académicas">/)
  assert.match(pageSource, /<section className="matricula-page__card matricula-page__filters sapp-filters-panel">\s*<h3 className="matricula-page__list-title">Listado de matrículas académicas<\/h3>\s*<div className="matricula-page__filters-top-row">/)
  assert.doesNotMatch(pageSource, /<header className="matricula-page__header">\s*<h3>Listado de matrículas académicas<\/h3>/)
})
