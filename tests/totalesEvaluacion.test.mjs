import assert from 'node:assert/strict'
import test from 'node:test'
import { createTestServer as createServer } from './helpers/createTestServer.mjs'

const item = (id, codigo, puntajeAspirante) => ({ id, codigo, puntajeAspirante })

test('totales de evaluación: suma por evaluador y promedio de la entrevista', async (t) => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  t.after(() => server.close())
  const { esTotalCalculado, sumarAspectos, promediarTotales } = await server.ssrLoadModule('/src/modules/admisiones/utils/totalesEvaluacion.ts')

  // Solo HV, ENTREV y ENTREV_MIEM_COMIT son totales calculados.
  for (const codigo of ['HV', 'ENTREV', 'ENTREV_MIEM_COMIT', ' ENTREV ']) assert.equal(esTotalCalculado({ codigo }), true, codigo)
  for (const codigo of ['HV_EXLAB', 'ENTREV_CEP', 'ASP1']) assert.equal(esTotalCalculado({ codigo }), false, codigo)

  const grupo = [item(1, 'ENTREV_MIEM_COMIT', 0), item(2, 'A', 2), item(3, 'B', 1.5), item(4, 'C', null)]
  // La fila de total no se cuenta a sí misma y un aspecto sin calificar cuenta como 0.
  assert.equal(sumarAspectos(grupo, {}), 3.5)
  // Lo que se está digitando manda sobre lo guardado, incluso si se borra el campo (queda vacío = 0).
  assert.equal(sumarAspectos(grupo, { 2: { puntajeAspirante: 1 }, 4: { puntajeAspirante: 2.25 } }), 4.75)
  assert.equal(sumarAspectos(grupo, { 3: { puntajeAspirante: undefined } }), 2)

  assert.equal(promediarTotales([]), 0)
  assert.equal(promediarTotales([5, 4]), 4.5)
  assert.equal(promediarTotales([10, 9, 8.5]), 9.17)
})
