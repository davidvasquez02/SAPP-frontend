import assert from 'node:assert/strict'
import test from 'node:test'
import { getEstadoEntrevista } from '../src/modules/admisiones/utils/estadoEntrevista.ts'
import type { EvaluacionAdmisionItem } from '../src/modules/admisiones/types/evaluacionAdmisionTypes.ts'

const fila = (changes: Partial<EvaluacionAdmisionItem> = {}): EvaluacionAdmisionItem => ({
  id: 1, inscripcionId: 74, etapaEvaluacion: 'ENTREVISTA', aspecto: 'Aspecto',
  codigo: 'ENTREV_CEP', consideraciones: null, evaluador: 'Nombre repetido',
  evaluadorId: 62, fechaRegistro: '2026-08-24 19:53:08', observaciones: null,
  ponderacionId: 16, puntajeAspirante: 0, puntajeMax: 2, ...changes,
})

test('nota cero cuenta y otros evaluadores y resumen no afectan el estado propio', () => {
  assert.deepEqual(getEstadoEntrevista([
    fila(), fila({ evaluadorId: 65, puntajeAspirante: null }),
    fila({ codigo: 'ENTREV', evaluadorId: null, fechaRegistro: null }),
  ], 62), { total: 1, completos: 1, label: 'Calificado' })
})

test('requiere nota y fecha en todos los registros propios', () => {
  for (const changes of [{ puntajeAspirante: null }, { fechaRegistro: null }, { fechaRegistro: ' ' }]) {
    assert.equal(getEstadoEntrevista([fila(), fila(changes)], 62).label, 'Pendiente de calificación')
  }
})

test('no confunde ausencia de asignación con calificación completa', () => {
  assert.equal(getEstadoEntrevista([fila()], 65).label, 'Sin aspectos asignados')
})
