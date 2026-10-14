import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

test('guardar un título reutiliza la imagen registrada y estudiantes omiten título', async (t) => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  t.after(() => server.close())
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else delete globalThis.localStorage
  })
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (init?.method === 'POST') {
      requests.push({ url: String(url), body: JSON.parse(init.body) })
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ ok: true, data: { titulo: 'MSc.', contenidoFirma: 'data:image/png;base64,ZmlybWE=' } }), { headers: { 'Content-Type': 'application/json' } })
  })
  const { obtenerFirmaUsuario, guardarFirmaUsuario } = await server.ssrLoadModule('/src/modules/perfil/services/firmaPerfilService.ts')
  const saved = await obtenerFirmaUsuario(42)
  const signature = { nombreArchivo: 'firma-registrada', mimeType: 'image/png', contenidoBase64: saved.contenidoFirma.split(',')[1] }
  await guardarFirmaUsuario(42, ' PhD. ', signature)
  assert.ok(requests[0].url.endsWith('/sapp/firmaUsuario/42'))
  assert.deepEqual(requests[0].body, { titulo: 'PhD.', contenidoFirma: saved.contenidoFirma })
  await guardarFirmaUsuario(42, undefined, signature)
  assert.deepEqual(requests[1].body, { contenidoFirma: saved.contenidoFirma })
})
