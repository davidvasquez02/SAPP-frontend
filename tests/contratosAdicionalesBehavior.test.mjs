import assert from 'node:assert/strict'
import test from 'node:test'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('contratos adicionales: consultas y errores de admisiones y fechas', async t => {
  const ui = await reactApiHarness(t)
  const profesor = await ui.load('/src/modules/admisionesProfesor/api/admisionesProfesorService.ts')
  const aspirantes = await ui.load('/src/modules/admisiones/api/aspiranteService.ts')
  const investigacion = await ui.load('/src/api/aspiranteService.ts')
  const fechas = await ui.load('/src/modules/configFechas/api/periodoAcademicoFechaService.ts')
  let payload
  t.beforeEach(() => { payload = { ok: true, data: [{ id: 8 }] }; ui.response(() => Response.json(payload)) })
  for (const [nombre, consultar, ruta] of [
    ['convocatorias docentes', profesor.getConvocatoriasApi, '/api/sapp/convocatoriaAdmision'],
    ['inscripciones docentes', () => profesor.getInscripcionesByConvocatoria(8), '/api/sapp/inscripcionAdmision/convocatoria/8'],
    ['aspirantes', aspirantes.getAspirantes, '/sapp/aspirante'],
    ['aspirante individual', () => aspirantes.getAspiranteById(8), '/sapp/aspirante/8'],
    ['información del aspirante', aspirantes.getAspiranteConsultaInfo, '/sapp/aspirante/consultaInfo'],
  ]) {
    await t.test(`${nombre}: respuesta y ruta correctas; error funcional propagado`, async () => {
      assert.deepEqual(await consultar(), [{ id: 8 }])
      assert.ok(new URL(ui.requests.at(-1).url, 'https://test.invalid').pathname.endsWith(ruta))
      payload = { ok: false, message: 'Consulta rechazada' }
      await assert.rejects(consultar(), /Consulta rechazada/)
      payload = { ok: false }
      await assert.rejects(consultar(), /No fue posible/)
    })
  }
  await t.test('consultas docentes sin datos producen listas vacías', async () => {
    payload = { ok: true, data: null }
    assert.deepEqual(await profesor.getConvocatoriasApi(), [])
    assert.deepEqual(await profesor.getInscripcionesByConvocatoria(8), [])
  })
  await t.test('investigación conserva identificadores y comunica rechazo del servidor', async () => {
    const request = { id: 8, grupoInvestigacionId: 3, directorId: 4 }
    await investigacion.updateAspiranteInvestigacion(request)
    assert.equal(ui.requests.at(-1).init.method, 'PUT')
    assert.deepEqual(JSON.parse(ui.requests.at(-1).init.body), request)
    payload = { ok: false, message: 'Director no disponible' }
    await assert.rejects(investigacion.updateAspiranteInvestigacion(request), /Director no disponible/)
    payload = { ok: false }
    await assert.rejects(investigacion.updateAspiranteInvestigacion(request), /No fue posible actualizar/)
  })
  await t.test('fechas envía configuración completa y propaga errores', async () => {
    const request = { periodoAcademicoId: 8, tipoFechaId: 3, fechaInicio: '2030-01-01', fechaFin: '2030-02-01' }
    await fechas.savePeriodoAcademicoFecha(request)
    assert.equal(ui.requests.at(-1).init.method, 'POST')
    assert.deepEqual(JSON.parse(ui.requests.at(-1).init.body), request)
    payload = { ok: false, message: 'Período cerrado' }
    await assert.rejects(fechas.savePeriodoAcademicoFecha(request), /Período cerrado/)
    payload = { ok: false }
    await assert.rejects(fechas.savePeriodoAcademicoFecha(request), /No fue posible guardar/)
  })
})
