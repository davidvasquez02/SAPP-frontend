import assert from 'node:assert/strict'
import test from 'node:test'
import { etiquetaResumen, GUIA_COORDINACION, GUIA_ESTUDIANTE, puedeEjecutarAccion } from '../src/modules/matricula-financiera/flow.ts'

test('la guía explica el proceso completo para ambos perfiles', () => {
  assert.equal(GUIA_COORDINACION.length, 4)
  assert.equal(GUIA_ESTUDIANTE.length, 4)
  assert.match(GUIA_COORDINACION.at(-1)?.titulo ?? '', /Publica/)
  assert.match(GUIA_ESTUDIANTE.at(-1)?.descripcion ?? '', /total/)
})

test('solo permite acciones compatibles con el estado del proceso', () => {
  assert.equal(puedeEjecutarAccion('BORRADOR', 'convocar'), true)
  assert.equal(puedeEjecutarAccion('BORRADOR', 'publicar'), false)
  assert.equal(puedeEjecutarAccion('ABIERTO', 'cerrar'), true)
  assert.equal(puedeEjecutarAccion('CERRADO', 'publicar'), true)
  assert.equal(puedeEjecutarAccion('PUBLICADO', 'recalcular'), false)
})

test('presenta las métricas con etiquetas de negocio legibles', () => {
  assert.equal(etiquetaResumen('noLiquidar'), 'No liquidar')
  assert.equal(etiquetaResumen('conAlertas'), 'Con alertas')
  assert.equal(etiquetaResumen('otra'), 'otra')
})
