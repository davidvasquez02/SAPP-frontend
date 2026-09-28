import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  'src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx',
  'utf8',
)

test('el resumen de inscripción no muestra un estado de evaluación sin información útil', () => {
  assert.doesNotMatch(source, /Estado de evaluación/)
  assert.doesNotMatch(source, /getEvaluacionLabel/)
  assert.match(source, /Estado de inscripción/)
})
