import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  ESTADO_ENTREVISTA_NO_INICIADA,
  getEstadoEntrevista,
  getOrdenEstadoEntrevista,
} from '../src/modules/admisiones/utils/estadoEntrevista.ts'
import type { EvaluacionAdmisionItem } from '../src/modules/admisiones/types/evaluacionAdmisionTypes.ts'

const admisionesProfesorPath = new URL(
  '../src/pages/AdmisionesProfesor/AdmisionesProfesorPage.tsx',
  import.meta.url,
)

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

test('presenta la evaluación como no iniciada cuando no hay aspectos propios', () => {
  assert.equal(getEstadoEntrevista([fila()], 65).label, ESTADO_ENTREVISTA_NO_INICIADA)
})

test('ordena primero pendientes, luego calificados y al final no iniciados', () => {
  const estados = [ESTADO_ENTREVISTA_NO_INICIADA, 'Calificado', 'Pendiente de calificación']

  assert.deepEqual(estados.sort((a, b) => getOrdenEstadoEntrevista(a) - getOrdenEstadoEntrevista(b)), [
    'Pendiente de calificación',
    'Calificado',
    ESTADO_ENTREVISTA_NO_INICIADA,
  ])
})

test('el listado destaca la entrevista y no presenta la etapa no iniciada como error', async () => {
  const source = await readFile(admisionesProfesorPath, 'utf8')

  assert.match(source, /admisiones-profesor__interview-status/)
  assert.match(source, /getOrdenEstadoEntrevista\(estadoA\) - getOrdenEstadoEntrevista\(estadoB\)/)
  assert.match(source, /label = ESTADO_ENTREVISTA_NO_INICIADA/)
  assert.doesNotMatch(source, /No se pudo consultar/)
})
