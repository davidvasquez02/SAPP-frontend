import assert from 'node:assert/strict'
import test from 'node:test'
import {
  esExamenCandidaturaDoctoral,
  tieneProcesoEvaluacionTg,
  TIPOS_TRABAJO_GRADO_POR_NIVEL,
} from '../src/modules/trabajos-grado/constants.ts'
import { presentarValorEvaluacion } from '../src/modules/trabajos-grado/evaluacion/presentacionEvaluacion.ts'

test('incluye el examen de candidatura doctoral en el módulo y su proceso de evaluación', () => {
  assert.equal(TIPOS_TRABAJO_GRADO_POR_NIVEL.doctorado.includes(9), true)
  assert.equal(tieneProcesoEvaluacionTg('CAND_DOCTORAL'), true)
  assert.equal(esExamenCandidaturaDoctoral(9), true)
  assert.equal(esExamenCandidaturaDoctoral(undefined, ' cand_doctoral '), true)
})

test('presenta la nota de sustentación para candidatura doctoral', () => {
  const presentada = presentarValorEvaluacion({
    id: 1,
    momentoCodigo: 'SUSTENTACION',
    nota: 4.5,
    resultadoNombre: 'APROBADO',
  }, 'CAND_DOCTORAL')

  assert.deepEqual(presentada, { etiqueta: 'Nota', valor: 4.5 })
})

test('conserva el resultado de sustentación para propuesta y defensa', () => {
  const presentada = presentarValorEvaluacion({
    id: 2,
    momentoCodigo: 'SUSTENTACION',
    nota: 4.5,
    resultadoNombre: 'APROBADO',
  }, 'DEF_TESIS_DCC')

  assert.deepEqual(presentada, { etiqueta: 'Resultado', valor: 'APROBADO' })
})
