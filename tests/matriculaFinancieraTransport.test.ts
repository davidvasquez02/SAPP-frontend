import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createLiquidacionClient, LiquidacionApiError } from '../src/modules/matricula-financiera/transport.ts'
import { filtrarEstudiantesPorNombre } from '../src/modules/matricula-financiera/studentSearch.ts'

test('preserva /api/sapp, token interno, cuerpo JSON y rutas hermanas de documentos/catálogos', async t => {
  const requests: Array<{ url: string; init?: RequestInit }> = []
  t.mock.method(globalThis, 'fetch', async (url: string, init?: RequestInit) => {
    requests.push({ url, init })
    return new Response(JSON.stringify({ ok: true, message: 'Listo', data: { id: 17 } }), { status: 200 })
  })
  const client = createLiquidacionClient('/api/sapp/', { getSession: () => ({ accessToken: 'token-simulado' }), clearSession: () => {} })
  const value = await client.call('/mias/17/respuestas', { method: 'PUT', body: JSON.stringify({ certificadoVotacion: false, deseaSalud: true }) })
  await client.call('/document?codigoTipoTramite=1018&tramiteId=17', {}, true)
  await client.call('/estudiantes?query=PRUEBA', {}, true)
  assert.deepEqual(value, { id: 17 })
  assert.deepEqual(requests.map(r => r.url), ['/api/sapp/liquidacionMatricula/mias/17/respuestas', '/api/sapp/document?codigoTipoTramite=1018&tramiteId=17', '/api/sapp/estudiantes?query=PRUEBA'])
  assert.equal(new Headers(requests[0].init?.headers).get('X-Internal-Token'), 'token-simulado')
  assert.equal(new Headers(requests[0].init?.headers).get('Content-Type'), 'application/json')
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { certificadoVotacion: false, deseaSalud: true })
})
test('400 conserva campos, 403/409 no cierran sesión y 401 la invalida', async t => {
  let status = 400; let cleared = 0
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ok: false, message: 'Mensaje del servidor', data: { motivo: 'Obligatorio', extra: { privado: true } } }), { status }))
  const client = createLiquidacionClient('/api/sapp', { getSession: () => null, clearSession: () => { cleared++ } })
  for (status of [400, 403, 409, 401]) {
    await assert.rejects(client.call('/procesos/1'), error => {
      assert.ok(error instanceof LiquidacionApiError)
      assert.equal(error.status, status)
      assert.equal(error.message, 'Mensaje del servidor')
      assert.deepEqual(error.fields, { motivo: 'Obligatorio' })
      return true
    })
    assert.equal(cleared, status === 401 ? 1 : 0)
  }
})
test('Excel conserva binario y los errores JSON; no intenta leer éxito como JSON', async t => {
  let failure = false
  t.mock.method(globalThis, 'fetch', async () => failure ? new Response(JSON.stringify({ ok: false, message: 'No hay filas exportables', data: null }), { status: 409 }) : new Response(new Uint8Array([80, 75, 3, 4]), { status: 200 }))
  const client = createLiquidacionClient('/api/sapp', { getSession: () => null, clearSession: () => {} })
  assert.deepEqual(new Uint8Array(await (await client.file('/procesos/1/exportar')).arrayBuffer()), new Uint8Array([80, 75, 3, 4]))
  failure = true
  await assert.rejects(client.file('/procesos/1/exportar'), /No hay filas exportables/)
})
test('propaga señal de cancelación y errores de red sin reintentar una mutación', async t => {
  const controller = new AbortController(); let calls = 0
  t.mock.method(globalThis, 'fetch', async (_url: string, init?: RequestInit) => {
    calls++; assert.equal(init?.signal, controller.signal); throw new TypeError('Red interrumpida')
  })
  const client = createLiquidacionClient('/api/sapp', { getSession: () => null, clearSession: () => {} })
  await assert.rejects(client.call('/procesos/1/publicar', { method: 'POST', signal: controller.signal }), /Red interrumpida/)
  assert.equal(calls, 1)
})

test('filtra la consulta general por nombres parciales sin depender de mayúsculas ni tildes', () => {
  assert.deepEqual(filtrarEstudiantesPorNombre([
    { estudiante: { id: 27, codigoEstudianteUis: '2127132' }, nombreCompleto: 'Jónnathan Alfredo Ramos Chaux' },
    { estudiante: { id: 28, codigoEstudianteUis: '2198160' }, nombreCompleto: 'Alexander Martinez Mendez' },
  ], 'jonnathan ramos'), [
    { id: 27, codigoNombre: '2127132 · Jónnathan Alfredo Ramos Chaux' },
  ])

  const apiSource = readFileSync(new URL('../src/modules/matricula-financiera/api.ts', import.meta.url), 'utf8')
  assert.match(apiSource, /coincidenciasCatalogo\.length > 0 \|\| \/\^\\d\+\$\//)
  assert.match(apiSource, /\/estudiantes\/consulta\?egresados=false/)
  assert.match(apiSource, /filtrarEstudiantesPorNombre\(estudiantes, texto\)/)
})
