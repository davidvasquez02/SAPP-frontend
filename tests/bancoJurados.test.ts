import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBancoJuradosPath } from '../src/modules/trabajos-grado/evaluacion/bancoJurados.ts'

test('consulta el directorio completo y agrega q solamente al aplicar un filtro', () => {
  assert.equal(buildBancoJuradosPath(), '/sapp/procesoEvaluacionTg/jurados/banco')
  assert.equal(buildBancoJuradosPath('   '), '/sapp/procesoEvaluacionTg/jurados/banco')
  assert.equal(
    buildBancoJuradosPath('  Ana Torres  '),
    '/sapp/procesoEvaluacionTg/jurados/banco?q=Ana%20Torres',
  )
})
