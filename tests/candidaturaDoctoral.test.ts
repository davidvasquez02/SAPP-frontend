import assert from 'node:assert/strict'
import test from 'node:test'
import {
  esExamenCandidaturaDoctoral,
  getNivelTrabajoGrado,
  tieneProcesoEvaluacionTg,
  TIPOS_TRABAJO_GRADO_POR_NIVEL,
  TIPO_EXAMEN_CANDIDATURA_DOCTORAL_ID,
  TIPO_SOLICITUD_GRADO_ID,
} from '../src/modules/trabajos-grado/constants.ts'
import {
  presentarNotaFinalCandidatura,
  presentarValorEvaluacion,
} from '../src/modules/trabajos-grado/evaluacion/presentacionEvaluacion.ts'

test('incluye el examen de candidatura doctoral en el módulo y su proceso de evaluación', () => {
  assert.equal(TIPOS_TRABAJO_GRADO_POR_NIVEL.doctorado.includes(TIPO_EXAMEN_CANDIDATURA_DOCTORAL_ID), true)
  assert.equal(tieneProcesoEvaluacionTg('CAND_DOCTORAL'), true)
  assert.equal(esExamenCandidaturaDoctoral(8), true)
  assert.equal(esExamenCandidaturaDoctoral(9), false)
  assert.equal(esExamenCandidaturaDoctoral(undefined, ' cand_doctoral '), true)
})

test('usa exclusivamente los tipos definidos por nivel para proyectos de grado', () => {
  assert.deepEqual(TIPOS_TRABAJO_GRADO_POR_NIVEL.maestria, [13, 9, 6, 7])
  assert.deepEqual(TIPOS_TRABAJO_GRADO_POR_NIVEL.doctorado, [13, 9, 8, 4, 5])
  assert.equal(TIPO_SOLICITUD_GRADO_ID, 9)
  assert.equal(TIPOS_TRABAJO_GRADO_POR_NIVEL.maestria.includes(8), false)
  assert.equal(TIPOS_TRABAJO_GRADO_POR_NIVEL.doctorado.includes(6), false)
  assert.equal(TIPOS_TRABAJO_GRADO_POR_NIVEL.doctorado.includes(7), false)
  assert.equal(TIPOS_TRABAJO_GRADO_POR_NIVEL.maestria.includes(10), false)
  assert.equal(TIPOS_TRABAJO_GRADO_POR_NIVEL.doctorado.includes(10), false)
})

test('reconoce el nivel doctoral con la nomenclatura vigente y la histórica', () => {
  assert.equal(getNivelTrabajoGrado('347 - DOCTORADO EN CIENCIAS DE LA COMPUTACION'), 'doctorado')
  assert.equal(getNivelTrabajoGrado('DOCTORADO EN CIENCIAS DE LA COMPUTACIÓN'), 'doctorado')
  assert.equal(getNivelTrabajoGrado('61204 - DCC'), 'doctorado')
  assert.equal(getNivelTrabajoGrado('302 - MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA'), 'maestria')
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

test('presenta la nota final únicamente para candidatura doctoral cuando existe', () => {
  assert.equal(presentarNotaFinalCandidatura(4, 'CAND_DOCTORAL'), '4,00')
  assert.equal(presentarNotaFinalCandidatura(4.25, ' cand_doctoral '), '4,25')
  assert.equal(presentarNotaFinalCandidatura(null, 'CAND_DOCTORAL'), null)
  assert.equal(presentarNotaFinalCandidatura(4, 'DEF_TESIS_DCC'), null)
})
