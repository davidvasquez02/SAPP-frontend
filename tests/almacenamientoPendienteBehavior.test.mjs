import assert from 'node:assert/strict'
import test from 'node:test'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('almacenamiento local y servicios de simulación: consistencia y aislamiento', async t => {
  const ui = await reactApiHarness(t)
  const store = await ui.load('/src/modules/solicitudes/mock/solicitudesStore.mock.ts')
  const documents = await ui.load('/src/modules/solicitudes/mock/solicitudDocumentosStore.mock.ts')
  const service = await ui.load('/src/modules/solicitudes/services/solicitudesMockService.ts')
  const config = await ui.load('/src/modules/configFechas/storage/configFechasStorage.ts')
  t.beforeEach(() => ui.dom.window.localStorage.clear())
  await t.test('consultas de solicitudes retornan copias y filtran propietario', async () => {
    const rows = store.getAllSolicitudesMock(); assert.ok(rows.length); const first = rows[0]; first.observaciones = 'mutación externa'
    assert.notEqual(store.getSolicitudByIdMock(first.id).observaciones, 'mutación externa'); assert.ok(store.getSolicitudesByEstudianteMock(first.estudianteId).every(r => r.estudianteId === first.estudianteId)); assert.equal(store.getSolicitudByIdMock(-1), null)
  })
  await t.test('cambio de estado fija resolución solo en estados terminales', async () => {
    const id = store.getAllSolicitudesMock()[0].id
    const approved = store.updateSolicitudEstadoMock({ id, estadoSigla: 'APROBADA' }); assert.equal(approved.estadoId, 3); assert.match(approved.fechaResolucion, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(store.updateSolicitudEstadoMock({ id, estadoSigla: 'RECHAZADA' }).fechaResolucion, approved.fechaResolucion)
    assert.equal(store.updateSolicitudEstadoMock({ id, estadoSigla: 'EN ESTUDIO' }).fechaResolucion, null); assert.throws(() => store.updateSolicitudEstadoMock({ id: -1, estadoSigla: 'APROBADA' }), /Solicitud no encontrada/)
  })
  await t.test('editar solicitud valida tipo y conserva motivos cuando no se reemplazan', async () => {
    const id = store.getAllSolicitudesMock()[0].id; const types = await service.fetchTiposSolicitud(); const type = types[0]
    const changed = store.updateSolicitudEstudianteMock({ id, tipoSolicitudId: type.id, observaciones: 'Actualizada', motivosCreditoCondonable: ['Motivo'] }); assert.equal(changed.observaciones, 'Actualizada')
    assert.deepEqual(store.updateSolicitudEstudianteMock({ id, tipoSolicitudId: type.id, observaciones: 'Otra' }).motivosCreditoCondonable, ['Motivo'])
    assert.throws(() => store.updateSolicitudEstudianteMock({ id, tipoSolicitudId: -1 }), /Tipo de solicitud no encontrado/); assert.throws(() => store.updateSolicitudEstudianteMock({ id: -1, tipoSolicitudId: type.id }), /Solicitud no encontrada/)
  })
  await t.test('servicio simulado conserva contratos de consulta y actualización', async () => {
    const rows = await service.fetchSolicitudesCoordinador(); const first = rows[0]; assert.equal((await service.fetchSolicitudDetalle(first.id)).id, first.id); assert.ok((await service.fetchSolicitudesEstudiante(first.estudianteId)).every(r => r.estudianteId === first.estudianteId))
    assert.equal((await service.updateSolicitudEstado(first.id, 'APROBADA')).estado, 'APROBADA'); assert.equal((await service.updateSolicitudEstudiante(first.id, { tipoSolicitudId: first.tipoSolicitudId, observaciones: 'Servicio' })).observaciones, 'Servicio'); await assert.rejects(service.fetchSolicitudDetalle(-1), /Solicitud no encontrada/)
  })
  await t.test('documentos toleran JSON inválido y sustituyen por requisito sin duplicar', () => {
    for (const [id, raw] of [[9001, '{roto'], [9002, '{}']]) { ui.dom.window.localStorage.setItem(`sapp:solicitudes:docs:${id}`, raw); assert.deepEqual(documents.loadSolicitudDocs(id), []) }
    ui.dom.window.localStorage.setItem('sapp:solicitudes:docs:9003', JSON.stringify([{ requirementId: 4, filename: 'original.pdf' }]))
    const copy = documents.loadSolicitudDocs(9003); copy[0].filename = 'externa'; assert.equal(documents.getSolicitudDoc(9003, 4).filename, 'original.pdf')
    documents.upsertSolicitudDoc(9003, { requirementId: 4, filename: 'nuevo.pdf' }); documents.upsertSolicitudDoc(9003, { requirementId: 5, filename: 'otro.pdf' }); assert.equal(documents.loadSolicitudDocs(9003).length, 2)
    documents.removeSolicitudDoc(9003, 4); assert.equal(documents.getSolicitudDoc(9003, 4), null); assert.equal(JSON.parse(ui.dom.window.localStorage.getItem('sapp:solicitudes:docs:9003')).length, 1)
  })
  await t.test('configuración por periodo reemplaza duplicados y ordena por actualización', () => {
    for (const raw of ['{roto', '{}']) { ui.dom.window.localStorage.setItem('SAPP_CONFIG_FECHAS_ADMISIONES', raw); assert.deepEqual(config.loadConfigs(), []) }
    ui.dom.window.localStorage.clear(); assert.equal(config.getConfigByPeriodo(7), null)
    config.upsertConfig({ periodoId: 7, updatedAt: '2030-01-01', descripcion: 'Anterior' }); config.upsertConfig({ periodoId: 8, updatedAt: '2030-02-01' }); config.upsertConfig({ periodoId: 7, updatedAt: '2030-03-01', descripcion: 'Nueva' })
    assert.deepEqual(config.loadConfigs().map(x => x.periodoId), [7, 8]); assert.equal(config.getConfigByPeriodo(7).descripcion, 'Nueva')
  })
})
