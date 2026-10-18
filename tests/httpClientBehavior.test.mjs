import assert from 'node:assert/strict'
import test from 'node:test'
import { apiHarness } from './helpers/apiHarness.mjs'

test('cliente HTTP: autenticación, errores de validación y descargas', async t => {
  const api = await apiHarness(t)
  const http = await api.load('/src/shared/http/httpClient.ts')
  const session = await api.load('/src/modules/auth/session/sessionStore.ts')
  const token = { accessToken: 'token-sintetico' }

  await t.test('normaliza prefijos y conserva URLs absolutas, token y Authorization explícito', async () => {
    session.saveSession(token)
    api.reply({ id: 3 })
    for (const path of ['/sapp/document', '/api/sapp/document', 'document']) {
      assert.deepEqual(await http.httpGet(path), { ok: true, data: { id: 3 }, message: '' })
      assert.equal(api.requests.at(-1).url, '/api/sapp/document')
      assert.equal(api.requests.at(-1).headers.get('Authorization'), 'Bearer token-sintetico')
    }
    await http.httpGet('https://example.test/archivo', { headers: { Authorization: 'Bearer alterno' } })
    assert.equal(api.requests.at(-1).url, 'https://example.test/archivo')
    assert.equal(api.requests.at(-1).headers.get('Authorization'), 'Bearer alterno')
    await http.httpGet('/publico', { auth: false })
    assert.equal(api.requests.at(-1).headers.has('Authorization'), false)
  })

  await t.test('JSON, multipart y operaciones sin cuerpo conservan su contrato', async () => {
    api.reply(null)
    for (const [method, fn] of [['POST', http.httpPost], ['PUT', http.httpPut], ['PATCH', http.httpPatch]]) {
      await fn('/solicitud', { observaciones: 'Corregir documentación' })
      assert.equal(api.requests.at(-1).init.method, method)
      assert.deepEqual(JSON.parse(api.requests.at(-1).init.body), { observaciones: 'Corregir documentación' })
      assert.equal(api.requests.at(-1).headers.get('Content-Type'), 'application/json')
      const form = new FormData()
      form.append('archivo', new Blob(['PDF']), 'soporte.pdf')
      await fn('/document', form)
      assert.equal(api.requests.at(-1).init.body, form)
      assert.equal(api.requests.at(-1).headers.has('Content-Type'), false)
    }
    await http.httpPost('/sin-cuerpo')
    assert.equal(api.requests.at(-1).init.body, undefined)
    await http.httpDelete('/document/3')
    assert.equal(api.requests.at(-1).init.method, 'DELETE')
    api.response(() => new Response(null, { status: 204 }))
    assert.equal(await http.httpPut('/estado'), undefined)
  })

  await t.test('401 limpia las dos sesiones; 403 conserva la sesión del usuario', async () => {
    for (const fn of [http.httpGet, http.httpFile]) {
      for (const status of [403, 401]) {
        session.saveSession(token)
        api.storage.setItem('session', JSON.stringify(token))
        api.response(() => new Response('', { status }))
        await assert.rejects(fn('/privado'), /No autorizado/)
        assert.equal(session.getToken(), status === 401 ? null : token.accessToken)
        assert.equal(api.storage.getItem('session') === null, status === 401)
      }
    }
  })

  await t.test('modo sin redirección expone el estado HTTP sin borrar sesión', async () => {
    session.saveSession(token)
    api.response(() => Response.json({ message: 'Sesión rechazada', data: { codigo: 'EXPIRADA' } }, { status: 401 }))
    await assert.rejects(http.httpGet('/privado', { redirectOnUnauthorized: false }), error => {
      assert.ok(error instanceof http.HttpError)
      assert.equal(error.status, 401)
      assert.deepEqual(error.data, { codigo: 'EXPIRADA' })
      return true
    })
    assert.equal(session.getToken(), token.accessToken)
  })

  await t.test('errores de campos admiten arrays, objetos y respuestas no JSON', async () => {
    const cases = [
      [{ message: 'Datos inválidos', errors: ['Falta documento', { field: 'nombre', message: 'obligatorio' }, { defaultMessage: 'Fuera de plazo' }, null, 1, { message: 8 }] }, 'Datos inválidos: Falta documento · nombre: obligatorio · Fuera de plazo'],
      [{ error: 'Validación', errors: { periodo: 'obligatorio', ignorar: null } }, 'Validación: periodo: obligatorio'],
      [{ errors: [null, {}] }, 'Error HTTP 400'],
      [{ errors: {} }, 'Error HTTP 400'],
      [{ errors: 'incompatible' }, 'Error HTTP 400'],
    ]
    for (const [body, expected] of cases) {
      api.response(() => Response.json(body, { status: 400 }))
      await assert.rejects(http.httpGet('/formulario'), error => error.status === 400 && error.message === expected)
    }
    api.response(() => new Response('Servicio caído', { status: 502 }))
    await assert.rejects(http.httpGet('/formulario'), /Error HTTP 502/)
    await assert.rejects(http.httpFile('/descarga'), /Servicio caído/)
    api.response(() => Response.json({ error: 'Archivo no disponible', errors: { archivo: 'pendiente' }, data: { id: 8 } }, { status: 409 }))
    await assert.rejects(http.httpFile('/descarga'), error => error.status === 409 && error.data.id === 8 && /archivo: pendiente/.test(error.message))
    api.response(() => new Response('', { status: 500 }))
    await assert.rejects(http.httpFile('/descarga'), /Error HTTP 500/)
    api.response(() => { throw new TypeError('Sin conexión') })
    await assert.rejects(http.httpGet('/formulario'), /Sin conexión/)
  })

  await t.test('descargas preservan bytes, MIME, nombres UTF-8 y fallback', async () => {
    session.saveSession(token)
    for (const [disposition, name] of [
      ["attachment; filename*=UTF-8''certificado%20matr%C3%ADcula.pdf", 'certificado matrícula.pdf'],
      ['attachment; filename="acta.pdf"', 'acta.pdf'],
      ["attachment; filename*=UTF-8''archivo%ZZ.pdf", 'archivo%ZZ.pdf'],
      [null, null],
    ]) {
      api.response(() => new Response(new Uint8Array([0, 1, 255]), { headers: {
        'Content-Type': 'application/pdf', ...(disposition ? { 'Content-Disposition': disposition } : {}),
      } }))
      const file = await http.httpPostFile('/reporte', { periodoId: 8 })
      assert.equal(file.filename, name)
      assert.equal(file.contentType, 'application/pdf')
      assert.deepEqual([...new Uint8Array(await file.blob.arrayBuffer())], [0, 1, 255])
      assert.equal(api.requests.at(-1).headers.get('Authorization'), 'Bearer token-sintetico')
    }
    api.response(() => new Response(new Uint8Array([1])))
    assert.equal((await http.httpFile('/binario', { auth: false })).contentType, 'application/octet-stream')
    assert.equal(api.requests.at(-1).headers.has('Authorization'), false)
  })
})
