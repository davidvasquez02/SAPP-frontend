import assert from 'node:assert/strict'
import test from 'node:test'
import { apiHarness } from './helpers/apiHarness.mjs'

test('solicitudes académicas: consulta, radicación, previsualización y cambio de estado', async t => {
  const api = await apiHarness(t)
  const service = await api.load('/src/modules/solicitudes/api/solicitudesAcademicasService.ts')
  const { cambiarEstadoSolicitud } = await api.load('/src/modules/solicitudes/api/solicitudCambioEstadoService.ts')
  const solicitud = { id: 24, estudianteId: 18, estado: 'RADICADA' }

  await t.test('filtros opcionales se combinan y consultas vacías se normalizan', async () => {
    api.reply([solicitud])
    assert.deepEqual(await service.getSolicitudesAcademicasFiltered({ estadoId: 0, tipoSolicitudId: 3 }), [solicitud])
    const url = new URL(api.requests.at(-1).url, 'https://example.test')
    assert.equal(url.searchParams.get('estadoId'), '0')
    assert.equal(url.searchParams.get('tipoSolicitudId'), '3')
    await service.getSolicitudesAcademicas()
    assert.equal(api.requests.at(-1).url, '/api/sapp/solicitudesAcademicas')
    api.reply(null)
    for (const invoke of [() => service.getSolicitudesAcademicasByEstudiante(18), () => service.getSolicitudesAcademicasAsignadas(6), () => service.getHistorialSolicitudAcademica(24), () => service.getHistorialHomologaciones()]) {
      assert.deepEqual(await invoke(), [])
    }
    api.reply(solicitud)
    assert.deepEqual(await service.getSolicitudAcademicaById(24), solicitud)
    api.reply(null)
    await assert.rejects(service.getSolicitudAcademicaById(24), /Solicitud no encontrada/)
  })

  await t.test('radicar conserva cuerpo y respuesta; no inventa id ante respuesta vacía', async () => {
    const payload = { estudianteId: 18, tipoSolicitudId: 3, justificacion: 'Homologación de asignaturas' }
    api.reply({ id: 24 })
    assert.deepEqual(await service.createSolicitudAcademica(payload), { id: 24 })
    assert.equal(api.requests.at(-1).init.method, 'POST')
    assert.deepEqual(JSON.parse(api.requests.at(-1).init.body), payload)
    api.reply(null)
    assert.equal(await service.createSolicitudAcademica(payload), null)
    await service.firmarDocumentosSolicitudAcademica(24)
    assert.equal(api.requests.at(-1).url, '/api/sapp/firmasDocumento/solicitudesAcademicas/24')
  })

  await t.test('previsualización admite uno o varios documentos pero exige contenido y MIME', async () => {
    const doc = { base64DocumentoContenido: 'JVBERi0=', mimeTypeDocumentoContenido: 'application/pdf' }
    for (const data of [doc, [doc, { ...doc, nombre: 'anexo.pdf' }]]) {
      api.reply(data)
      assert.deepEqual(await service.previsualizarSolicitudCredito({ estudianteId: 18 }), Array.isArray(data) ? data : [doc])
    }
    for (const data of [null, [], [{}], [{ ...doc, base64DocumentoContenido: '' }], [{ ...doc, mimeTypeDocumentoContenido: null }]]) {
      api.reply(data)
      await assert.rejects(service.previsualizarSolicitudCredito({}), /No fue posible generar/)
    }
  })

  await t.test('rechazo y envío al Consejo conservan motivo, acta y booleano false', async () => {
    api.reply(null)
    await cambiarEstadoSolicitud(24, 'RECHAZADA', { enviarConsejo: false, actaId: 8, observaciones: 'Falta firma & soporte académico' })
    const url = new URL(api.requests.at(-1).url, 'https://example.test')
    assert.equal(api.requests.at(-1).init.method, 'PUT')
    assert.equal(url.searchParams.get('siglaEstado'), 'RECHAZADA')
    assert.equal(url.searchParams.get('enviarConsejo'), 'false')
    assert.equal(url.searchParams.get('actaId'), '8')
    assert.equal(url.searchParams.get('observaciones'), 'Falta firma & soporte académico')
    await cambiarEstadoSolicitud(24, 'APROBADA')
    assert.equal(new URL(api.requests.at(-1).url, 'https://example.test').searchParams.size, 1)
  })

  await t.test('cada operación propaga rechazo funcional y mensaje de respaldo', async () => {
    for (const invoke of [
      () => service.getSolicitudesAcademicas(), () => service.getSolicitudesAcademicasAsignadas(6),
      () => service.getSolicitudesAcademicasByEstudiante(18), () => service.getSolicitudAcademicaById(24),
      () => service.getHistorialSolicitudAcademica(24), () => service.getHistorialHomologaciones(),
      () => service.createSolicitudAcademica({}), () => service.firmarDocumentosSolicitudAcademica(24),
      () => service.previsualizarSolicitudCredito({}), () => cambiarEstadoSolicitud(24, 'APROBADA'),
    ]) {
      api.reply(null, { ok: false, message: 'Transición no permitida' })
      await assert.rejects(invoke(), /Transición no permitida/)
      api.reply(null, { ok: false })
      await assert.rejects(invoke(), /No fue posible/)
    }
  })
})
