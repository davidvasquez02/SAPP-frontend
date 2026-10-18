import assert from 'node:assert/strict'
import test from 'node:test'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('servicios pendientes: fotos por lotes, resúmenes, JWT y cliente compatible', async t => {
  const api = await reactApiHarness(t)
  const photos = await api.load('/src/modules/documentos/api/documentoFotoService.ts')
  const loader = await api.load('/src/modules/estudiantes/services/estudianteFotoLoader.ts')
  const details = await api.load('/src/modules/estudiantes/services/estudianteDetalleService.ts')
  const jwt = await api.load('/src/utils/jwt.ts')
  const ids = await api.load('/src/modules/solicitudes/utils/getEstudianteId.ts')
  const legacy = await api.load('/src/api/httpClient.ts')
  const available = await api.load('/src/modules/admisiones/api/evaluacionAdmisionAvailabilityService.ts')
  const cache = await api.load('/src/modules/admisiones/api/evaluacionAdmisionAvailabilityCache.ts')
  let responseRows, failed, calls
  const input = { codigoTipoTramite: 1002, codigoTipoDocumentoTramite: 'ANX-4', tramiteIds: [1, 1, 0, -1, NaN, 2] }
  t.beforeEach(() => { responseRows = []; failed = false; calls = []; api.response(url => { calls.push(new URL(url, 'https://test.invalid')); return failed ? Response.json({ ok: false, message: 'Consulta fallida' }) : Response.json({ ok: true, data: responseRows }) }) })
  await t.test('foto individual usa tipo solicitado, MIME y ambos contratos de contenido', async () => {
    for (const uploaded of [{ base64DocumentoContenido: 'YWJj', mimeTypeDocumentoContenido: 'image/png' }, { contenidoBase64: 'YWJj' }]) {
      responseRows = [{ codigoTipoDocumentoTramite: 'OTRO', documentoCargado: true }, { codigoTipoDocumentoTramite: 'ANX-4', documentoCargado: true, documentoUploadedResponse: uploaded }]
      const photo = await photos.getFotoDocumentoByTramite({ ...input, tramiteId: 1 }); assert.equal(photo, `data:${uploaded.mimeTypeDocumentoContenido ?? 'image/jpeg'};base64,YWJj`)
    }
  })
  await t.test('foto ausente, sin contenido o no cargada produce null', async () => {
    for (const row of [null, { documentoCargado: false }, { documentoCargado: true, documentoUploadedResponse: {} }]) {
      responseRows = row ? [{ codigoTipoDocumentoTramite: 'ANX-4', ...row }] : []
      assert.equal(await photos.getFotoDocumentoByTramite({ ...input, tramiteId: 1 }), null)
    }
  })
  await t.test('lote elimina duplicados/no finitos y omite fotos vacías', async () => {
    responseRows = [{ tramiteId: 1, documentoUploadedResponse: { contenidoBase64: 'YWJj', mimeType: 'image/png' } }, { tramiteId: 2, documentoUploadedResponse: null }, { tramiteId: 3, documentoUploadedResponse: {} }]
    const result = await photos.getFotosDocumentoByTramitesBulk(input); assert.deepEqual([...result], [[1, 'data:image/png;base64,YWJj']]); assert.equal(calls[0].searchParams.get('tramiteIds'), '1,2')
    const count = calls.length; assert.equal((await photos.getFotosDocumentoByTramitesBulk({ ...input, tramiteIds: [0, -1, NaN] })).size, 0); assert.equal(calls.length, count)
    failed = true; await assert.rejects(photos.getFotosDocumentoByTramitesBulk(input), /Consulta fallida/)
  })
  await t.test('lote individual conserva éxitos parciales y filtra ids repetidos', async () => {
    api.response(url => { const id = Number(new URL(url, 'https://test.invalid').searchParams.get('tramiteId')); calls.push(id); return Response.json({ ok: id !== 2, data: [{ codigoTipoDocumentoTramite: 'ANX-4', documentoCargado: true, documentoUploadedResponse: { contenidoBase64: 'YWJj' } }] }) })
    assert.deepEqual(await photos.getFotosDocumentoByTramites({ ...input, tramiteIds: [1, 1, 2, 0] }), { 1: 'data:image/jpeg;base64,YWJj' }); assert.equal(calls.length, 2)
  })
  await t.test('loader resuelve fotos en dos peticiones y reutiliza caché', async () => {
    const students = [{ id: 7001, idAspirante: 71 }, { id: 7002, idAspirante: null }]
    api.response(url => { calls.push(String(url)); return Response.json({ ok: true, data: String(url).includes('/by-aspirantes') ? [{ id: 160, aspiranteId: 71 }] : [{ tramiteId: 160, documentoUploadedResponse: { contenidoBase64: 'YWJj' } }] }) })
    const result = await loader.cargarFotosDeEstudiantesConAspirante(students); assert.equal(result.get(7001), 'data:image/jpeg;base64,YWJj'); assert.equal(calls.length, 2)
    await loader.cargarFotosDeEstudiantesConAspirante(students); assert.equal(calls.length, 2)
  })
  await t.test('loader sin inscripciones o con error conserva placeholders', async () => {
    assert.equal((await loader.cargarFotosDeEstudiantes([{ id: 7003, idAspirante: 73 }])).size, 0); failed = true; assert.equal((await loader.cargarFotosDeEstudiantes([{ id: 7004, idAspirante: 74 }])).size, 0)
  })
  await t.test('resúmenes consultan documentos del estudiante y trámite correcto', async () => {
    api.response(url => { const u = new URL(url, 'https://test.invalid'); calls.push(u)
      if (u.pathname.endsWith('/matriculaAcademica')) return Response.json({ ok: true, data: [{ id: 50, estudianteId: 7, periodoAcademico: '2030-1', estado: 'RADICADA' }, { id: 51, estudianteId: 8 }] })
      if (u.pathname.endsWith('/estudiante')) return Response.json({ ok: true, data: [{ id: 60, tipoSolicitud: 'OTRA', tipoTramiteCodigo: '4' }, { id: 61, tipoSolicitud: 'OTRA', tipoTramiteCodigo: null }] })
      if (u.pathname.includes('/aspirante/')) return Response.json({ ok: true, data: { id: 160, estado: 'ADMITIDO', puntajeTotal: 4 } })
      return Response.json({ ok: true, data: [] })
    })
    assert.equal((await details.getMatriculasByEstudiante(7)).length, 1); const requests = await details.getSolicitudesByEstudiante(7); assert.deepEqual(requests.map(r => r.id), [60, 61]); assert.deepEqual((await details.getAdmisionesByAspirante(70)).map(r => r.id), [160]); assert.equal(calls.filter(u => u.searchParams.get('tramiteId') === '61').length, 0)
  })
  await t.test('admisión inexistente retorna vacío, otros errores se propagan', async () => {
    responseRows = null; assert.deepEqual(await details.getAdmisionesByAspirante(70), [])
    api.response(() => Response.json({ ok: false, message: 'No existe una inscripcion admision' })); assert.deepEqual(await details.getAdmisionesByAspirante(70), [])
    failed = true; api.response(() => Response.json({ ok: false, message: 'Error distinto' })); await assert.rejects(details.getAdmisionesByAspirante(70), /Error distinto/)
  })
  await t.test('JWT decodifica Unicode/base64url y rechaza formato o JSON inválidos', async () => {
    const payload = { nombre: 'María 🧪', rol: 'ESTUDIANTE' }; const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url'); assert.deepEqual(jwt.decodeJwtPayload(`x.${encoded}.y`), payload)
    assert.throws(() => jwt.decodeJwtPayload('invalido'), /Token inválido/); assert.throws(() => jwt.decodeJwtPayload('x.YWJj.y'))
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'TextDecoder'); Object.defineProperty(globalThis, 'TextDecoder', { configurable: true, value: undefined }); try { assert.equal(jwt.base64UrlDecode(Buffer.from('María').toString('base64url')), 'María') } finally { Object.defineProperty(globalThis, 'TextDecoder', descriptor) }
  })
  await t.test('identidad estudiantil solo acepta número en sesión SAPP', () => {
    for (const s of [null, { kind: 'OTRO' }, { kind: 'SAPP', user: {} }, { kind: 'SAPP', user: { estudiante: { id: '7' } } }]) assert.equal(ids.getEstudianteId(s), null)
    assert.equal(ids.getEstudianteIdFromSession({ kind: 'SAPP', user: { estudiante: { id: 7 } } }), 7)
  })
  await t.test('cliente compatible conserva cabeceras, URLs y errores de respuesta', async () => {
    const absolute = new URL('https://test.invalid/data'); api.response(url => { assert.equal(url, absolute); return Response.json({ value: 1 }) }); assert.deepEqual(await legacy.request(absolute), { value: 1 })
    api.response(() => Response.json({ ok: true })); await legacy.request('path', { skipAuth: true, headers: { 'X-Test': 'yes' } }); assert.equal(api.requests.at(-1).headers.get('X-Test'), 'yes')
    api.response(() => new Response('No válido', { status: 400, statusText: 'Bad Request' })); await assert.rejects(legacy.request('https://test.invalid'), /Error 400 Bad Request: No válido/)
    api.response(() => ({ ok: false, status: 500, statusText: '', text: async () => { throw Error('lectura') } })); await assert.rejects(legacy.request('/sapp/x'), /Error 500/)
  })
  await t.test('disponibilidad consulta etapas una vez y reutiliza resultado cacheado', async () => {
    cache.invalidateEvaluacionAvailabilityCache(9871); api.response(url => { const u = new URL(url, 'https://test.invalid'); calls.push(u); return Response.json({ ok: true, data: u.searchParams.get('etapa') === 'ENTREVISTA' ? [] : [{}] }) })
    const expected = { hojaDeVida: true, examen: true, entrevistas: false }; assert.deepEqual(await available.getEvaluacionAvailability(9871), expected); assert.deepEqual(await available.getEvaluacionAvailability(9871), expected); assert.equal(calls.length, 3)
  })
})
