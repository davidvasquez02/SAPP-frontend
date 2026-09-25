import assert from 'node:assert/strict'
import test from 'node:test'
import {
  promedioNotasSustentacion,
  puedeAgendarSustentacion,
  todosLosJuradosActivosEvaluaronSustentacion,
} from '../src/modules/trabajos-grado/evaluacion/estadoProcesoEvaluacion.ts'
import type { JuradoEvaluador } from '../src/modules/trabajos-grado/evaluacion/types.ts'

const jurado = (
  id: number,
  activo: boolean,
  momentos: Array<{ momentoCodigo?: string; momento?: string; momentoNombre?: string }>,
): JuradoEvaluador => ({
  id,
  nombre: `Jurado ${id}`,
  correo: `jurado${id}@example.com`,
  institucion: 'UIS',
  externo: false,
  idioma: 'ES',
  activo,
  estadoInvitacion: 'ACEPTADA',
  evaluaciones: momentos.map((momento, index) => ({ id: id * 10 + index, momentoCodigo: '', ...momento })),
})

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

test('solo permite registrar el resultado cuando todos los jurados activos evaluaron la sustentación', () => {
  const completo = jurado(1, true, [{ momentoCodigo: 'SUSTENTACION' }])
  const pendiente = jurado(2, true, [{ momentoCodigo: 'CONCEPTO_DOCUMENTO' }])

  assert.equal(todosLosJuradosActivosEvaluaronSustentacion([completo, pendiente]), false)
  assert.equal(todosLosJuradosActivosEvaluaronSustentacion([
    completo,
    jurado(2, true, [{ momentoNombre: 'Sustentación' }]),
  ]), true)
})

test('ignora jurados reemplazados y exige al menos un jurado activo', () => {
  assert.equal(todosLosJuradosActivosEvaluaronSustentacion([
    jurado(1, true, [{ momento: 'SUSTENTACION' }]),
    jurado(2, false, []),
  ]), true)
  assert.equal(todosLosJuradosActivosEvaluaronSustentacion([jurado(2, false, [])]), false)
  assert.equal(todosLosJuradosActivosEvaluaronSustentacion([]), false)
})

test('calcula el promedio de notas de sustentación de los jurados activos', () => {
  const primero = jurado(1, true, [{ momentoCodigo: 'SUSTENTACION' }])
  const segundo = jurado(2, true, [{ momentoNombre: 'Sustentación' }])
  const retirado = jurado(3, false, [{ momento: 'SUSTENTACION' }])
  primero.evaluaciones[0].nota = 3.75
  segundo.evaluaciones[0].nota = 4.5
  retirado.evaluaciones[0].nota = 5

  assert.equal(promedioNotasSustentacion([primero, segundo, retirado]), 4.13)
  assert.equal(promedioNotasSustentacion([jurado(4, true, [{ momentoCodigo: 'CONCEPTO_DOCUMENTO' }])]), null)
})
