import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const pageSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')

test('evita repetir el título del proceso de matrícula en la vista estudiantil', () => {
  assert.match(pageSource, /<ModuleLayout title="Proceso de matrícula">/)
  assert.doesNotMatch(pageSource, /<header className="matricula-page__header">\s*<h3>Proceso de matrícula<\/h3>/)
  assert.match(pageSource, /<header className="matricula-page__header">\s*{convocatoria\?\.periodoLabel/)
})
