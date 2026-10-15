import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

test('documentos de admisión: metadatos y contenido individual bajo demanda', async t => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
  t.after(() => server.close())
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } })
  t.after(() => previous ? Object.defineProperty(globalThis, 'localStorage', previous) : delete globalThis.localStorage)
  const service = await server.ssrLoadModule('/src/modules/documentos/api/documentosService.ts')
  const cache = await server.ssrLoadModule('/src/pages/InscripcionDocumentos/documentosPrefetchCache.ts')
  const hoja = await server.ssrLoadModule('/src/modules/admisiones/pages/EvaluacionEtapaPage/evaluacionPrefetchCache.ts')
  const requests = []
  let state = 'POR_REVISAR'
  let missing = false
  let failContent = false
  const fixture = () => [{
    idTipoDocumentoTramite: 5, codigoTipoDocumentoTramite: 'ANX-2', nombreTipoDocumentoTramite: 'Hoja de vida',
    descripcionTipoDocumentoTramite: 'Documento de prueba', obligatorioTipoDocumentoTramite: true,
    documentoCargado: !missing, tipoTramite: 'ADMISION', documentoUploadedResponse: missing ? null : {
      idDocumento: 25, nombreArchivoDocumento: 'hoja.pdf', versionDocumento: 2,
      estadoDocumento: state, observacionesDocumento: 'Corregir documento',
      // Comprueba que incluso una respuesta de backend anterior no quede retenida en el listado.
      base64DocumentoContenido: 'QUJD', contenidoBase64: 'QUJD', mimeTypeDocumentoContenido: 'application/pdf',
    },
  }]
  t.mock.method(globalThis, 'fetch', async url => {
    const parsed = new URL(url, 'http://prueba.local')
    requests.push(parsed)
    if (parsed.pathname.endsWith('/document/25')) {
      if (failContent) return new Response(JSON.stringify({ ok: false, message: 'Archivo no disponible' }), { status: 502 })
      return new Response(JSON.stringify({ ok: true, data: { id: 25, contenidoBase64: 'UEZG', mimeType: 'application/pdf', nombreArchivo: 'hoja.pdf' } }))
    }
    return new Response(JSON.stringify({ ok: true, data: fixture() }))
  })

  await t.test('los consumidores existentes omiten el parámetro y conservan compatibilidad', async () => {
    await service.getDocumentosByTramiteParams({ tramiteId: 160, codigoTipoTramite: 1002 })
    assert.equal(requests.at(-1).searchParams.has('incluirContenido'), false)
  })

  await t.test('precarga ligera conserva estados y elimina contenido de su caché', async () => {
    requests.length = 0
    await Promise.all([cache.prefetchInscripcionDocumentos(160), cache.prefetchInscripcionDocumentos(160)])
    assert.equal(requests.length, 1)
    assert.equal(requests[0].searchParams.get('incluirContenido'), 'false')
    const item = cache.getCachedDocumentos(160)[0]
    assert.equal(item.documentoUploadedResponse.idDocumento, 25)
    assert.equal(item.validacionEstado, 'POR_REVISAR')
    assert.equal(item.validacionObservaciones, 'Corregir documento')
    assert.equal('base64DocumentoContenido' in item.documentoUploadedResponse, false)
    assert.equal('contenidoBase64' in item.documentoUploadedResponse, false)
    await cache.prefetchInscripcionDocumentos(160)
    assert.equal(requests.length, 1)
  })

  await t.test('invalidar tras aprobar o rechazar vuelve a consultar metadatos', async () => {
    state = 'RECHAZADO'
    cache.invalidateInscripcionDocumentosCache(160)
    await cache.prefetchInscripcionDocumentos(160)
    assert.equal(requests.at(-1).searchParams.get('incluirContenido'), 'false')
    assert.equal(cache.getCachedDocumentos(160)[0].validacionEstado, 'RECHAZADO')
  })

  await t.test('hoja de vida consulta metadatos y después el ID, y reutiliza su vista previa', async () => {
    requests.length = 0
    const doc = await hoja.cargarHojaVidaDocumento(160)
    assert.equal(requests.length, 2)
    assert.equal(requests[0].searchParams.get('incluirContenido'), 'false')
    assert.equal(requests[0].searchParams.get('codigoTipoDocumentoTramite'), 'ANX-2')
    assert.ok(requests[1].pathname.endsWith('/document/25'))
    assert.deepEqual(doc, { base64: 'UEZG', mimeType: 'application/pdf', filename: 'hoja.pdf' })
    assert.equal(await hoja.cargarHojaVidaDocumento(160), doc)
    assert.equal(requests.length, 2)
  })

  await t.test('documento pendiente no dispara petición individual', async () => {
    missing = true
    requests.length = 0
    assert.equal(await hoja.cargarHojaVidaDocumento(161), null)
    assert.equal(requests.length, 1)
    assert.equal(hoja.hojaVidaDocCache.has(161), false)
    missing = false
  })

  await t.test('error individual no se almacena y permite reintentar', async () => {
    failContent = true
    await assert.rejects(hoja.cargarHojaVidaDocumento(162), /Archivo no disponible/)
    assert.equal(hoja.hojaVidaDocCache.has(162), false)
    failContent = false
    assert.equal((await hoja.cargarHojaVidaDocumento(162)).base64, 'UEZG')
  })
})
