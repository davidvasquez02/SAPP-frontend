import assert from 'node:assert/strict'
import test from 'node:test'
import { createTestServer as createServer } from './helpers/createTestServer.mjs'

const evaluacion = (id, momentoCodigo, ronda, fechaRegistro) => ({ id, momentoCodigo, ronda, fechaRegistro })

const jurado = (id, activo, evaluaciones) => ({
  id,
  nombre: `Jurado ${id}`,
  correo: `jurado${id}@example.com`,
  institucion: 'UIS',
  externo: false,
  idioma: 'ES',
  activo,
  estadoInvitacion: 'ACEPTADA',
  evaluaciones,
})

test('rondas de conceptos: etiqueta, orden y progreso', async (t) => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  t.after(() => server.close())
  const {
    ETIQUETA_TRAS_CORRECCIONES,
    etiquetaRondaEvaluacion,
    evaluacionesOrdenadas,
    progresoConceptosDeLaRonda,
  } = await server.ssrLoadModule('/src/modules/trabajos-grado/evaluacion/presentacionEvaluacion.ts')

  // Solo el concepto del documento emitido tras las correcciones lleva la etiqueta de ronda.
  assert.equal(etiquetaRondaEvaluacion(evaluacion(1, 'CONCEPTO_DOCUMENTO', 1, '2026-01-01')), null)
  assert.equal(etiquetaRondaEvaluacion(evaluacion(2, 'CONCEPTO_DOCUMENTO', undefined, '2026-01-01')), null)
  assert.equal(etiquetaRondaEvaluacion(evaluacion(3, 'CONCEPTO_DOCUMENTO', 2, '2026-02-01')), ETIQUETA_TRAS_CORRECCIONES)
  assert.equal(etiquetaRondaEvaluacion(evaluacion(4, 'concepto_documento', 3, '2026-03-01')), ETIQUETA_TRAS_CORRECCIONES)
  // La sustentación no es un concepto sobre el documento, aunque se emita en una ronda posterior.
  assert.equal(etiquetaRondaEvaluacion(evaluacion(5, 'SUSTENTACION', 2, '2026-04-01')), null)

  // Las evaluaciones de un jurado se listan por ronda y luego por fecha, sin mutar el original.
  const j = jurado(1, true, [
    evaluacion(3, 'SUSTENTACION', 2, '2026-04-01'),
    evaluacion(2, 'CONCEPTO_DOCUMENTO', 2, '2026-03-01'),
    evaluacion(1, 'CONCEPTO_DOCUMENTO', 1, '2026-01-01'),
  ])
  assert.deepEqual(evaluacionesOrdenadas(j).map((item) => item.id), [1, 2, 3])
  assert.deepEqual(j.evaluaciones.map((item) => item.id), [3, 2, 1])

  // El progreso cuenta solo los conceptos de la ronda vigente y a los jurados activos.
  const jurados = [
    jurado(1, true, [evaluacion(1, 'CONCEPTO_DOCUMENTO', 1, '2026-01-01'), evaluacion(2, 'CONCEPTO_DOCUMENTO', 2, '2026-03-01')]),
    jurado(2, true, [evaluacion(3, 'CONCEPTO_DOCUMENTO', 1, '2026-01-02')]),
    jurado(3, false, [evaluacion(4, 'CONCEPTO_DOCUMENTO', 2, '2026-03-02')]),
  ]
  assert.deepEqual(progresoConceptosDeLaRonda(jurados, 2), { emitidos: 1, total: 2 })
  assert.deepEqual(progresoConceptosDeLaRonda(jurados, 1), { emitidos: 2, total: 2 })
})
