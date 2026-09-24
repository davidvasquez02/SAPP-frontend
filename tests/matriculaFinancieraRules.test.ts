import assert from 'node:assert/strict'
import test from 'node:test'
import { ajustesActuales, fechaColombia, puedeEditarFila, seleccionarRespuestas } from '../src/modules/matricula-financiera/rules.ts'
import type { CuerposLiquidacion, EstadoLiquidacion, EstadoProcesoLiquidacion, LiquidacionMatricula } from '../src/modules/matricula-financiera/types.ts'

test('un estudiante nuevo nunca envía los campos exclusivos de vigente, incluso si venían poblados', () => {
  const answers = { entregoTrabajoGrado: true, cumLaude: null, certificadoVotacion: false, deseaSalud: true }
  assert.deepEqual(seleccionarRespuestas(answers, 'NUEVO'), { certificadoVotacion: false, deseaSalud: true })
  assert.deepEqual(answers, { entregoTrabajoGrado: true, cumLaude: null, certificadoVotacion: false, deseaSalud: true })
})
test('las preguntas dinámicas excluyen claves no aplicables sin convertir null en false', () => {
  assert.deepEqual(seleccionarRespuestas({ certificadoVotacion: null, deseaSalud: false }, 'VIGENTE', [
    { clave: 'certificadoVotacion', aplica: true, texto: 'Votación' },
    { clave: 'deseaSalud', aplica: false, texto: 'Salud' },
  ]), { certificadoVotacion: null })
})
test('vigente conserva sus cuatro respuestas ternarias', () => {
  assert.deepEqual(seleccionarRespuestas({ entregoTrabajoGrado: false, cumLaude: true, deseaSalud: false }, 'VIGENTE'), {
    entregoTrabajoGrado: false, cumLaude: true, certificadoVotacion: null, deseaSalud: false,
  })
})
test('ninguna edición de fila puede realizarse después de publicar', () => {
  const estados: EstadoLiquidacion[] = ['PENDIENTE_RESPUESTA', 'RESPONDIDA', 'NO_LIQUIDAR', 'LIQUIDADA']
  const acciones: (keyof CuerposLiquidacion)[] = ['respuestas', 'ajustes', 'excluir', 'reincluir', 'liquidada']
  for (const estado of estados) for (const accion of acciones) assert.equal(puedeEditarFila('PUBLICADO', { estado, totalFinal: 0 }, accion), false)
})
test('matriz de filas antes de publicar permite respaldo, exclusión y reinclusión solo en estados válidos', () => {
  const procesos: EstadoProcesoLiquidacion[] = ['BORRADOR', 'ABIERTO', 'CERRADO']
  for (const proceso of procesos) {
    for (const estado of ['PENDIENTE_RESPUESTA', 'RESPONDIDA'] as const) {
      assert.equal(puedeEditarFila(proceso, { estado }, 'respuestas'), true)
      assert.equal(puedeEditarFila(proceso, { estado }, 'excluir'), true)
      assert.equal(puedeEditarFila(proceso, { estado }, 'reincluir'), false)
    }
    for (const estado of ['NO_LIQUIDAR', 'LIQUIDADA'] as const) {
      assert.equal(puedeEditarFila(proceso, { estado }, 'respuestas'), false)
      assert.equal(puedeEditarFila(proceso, { estado }, 'excluir'), false)
      assert.equal(puedeEditarFila(proceso, { estado }, 'ajustes'), true)
    }
    assert.equal(puedeEditarFila(proceso, { estado: 'NO_LIQUIDAR' }, 'reincluir'), true)
    assert.equal(puedeEditarFila(proceso, { estado: 'LIQUIDADA' }, 'reincluir'), false)
  }
})
test('marcar exige respuesta y total; cero es válido; desmarcar es posible', () => {
  assert.equal(puedeEditarFila('CERRADO', { estado: 'RESPONDIDA', totalFinal: null }, 'liquidada'), false)
  assert.equal(puedeEditarFila('ABIERTO', { estado: 'RESPONDIDA', totalFinal: 0 }, 'liquidada'), true)
  assert.equal(puedeEditarFila('ABIERTO', { estado: 'PENDIENTE_RESPUESTA', totalFinal: 20 }, 'liquidada'), false)
  assert.equal(puedeEditarFila('CERRADO', { estado: 'LIQUIDADA', totalFinal: 20 }, 'liquidada'), true)
})
test('la edición preserva el reemplazo completo y el valor final manual cero', () => {
  const fila = { semestre: 9, promocion: 21, ajusteManual: -500.1234, valorFinalManual: 0, observaciones: 'Resolución autorizada' } as LiquidacionMatricula
  assert.deepEqual(ajustesActuales(fila), { semestre: 9, promocion: 21, ajusteManual: -500.1234, valorFinalManual: 0, observaciones: 'Resolución autorizada' })
})
test('la fecha local no desplaza el día ni la hora de Colombia', () => {
  assert.equal(fechaColombia('2026-09-24T00:15:43.1234'), '24/09/2026 00:15')
  assert.equal(fechaColombia('2026-09-24'), '24/09/2026')
})
