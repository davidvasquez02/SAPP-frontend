import assert from 'node:assert/strict'
import test from 'node:test'
import { puedeAgendarSustentacion } from '../src/modules/trabajos-grado/evaluacion/estadoProcesoEvaluacion.ts'

test('permite agendar sustentación cuando los conceptos o ajustes fueron recibidos', () => {
  for (const estado of ['CONCEPTOS_REC', 'CONCEPTOS RECIBIDOS', 'AJUSTES_RECIB', 'AJUSTES RECIBIDOS']) {
    assert.equal(puedeAgendarSustentacion(estado), true, estado)
  }
})

test('conserva la posibilidad existente mientras el estudiante está en ajustes', () => {
  assert.equal(puedeAgendarSustentacion('EN_AJUSTES'), true)
  assert.equal(puedeAgendarSustentacion('EN EVALUACION'), false)
  assert.equal(puedeAgendarSustentacion('SUST_PROGRAMADA'), false)
})
