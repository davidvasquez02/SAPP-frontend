import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

const { chromium } = createRequire(import.meta.url)(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')

test('Coordinador abre primero y Profesor sigue disponible en el selector', async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => {
    server.httpServer.close()
    server.httpServer.closeAllConnections()
  })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())
  const page = await browser.newPage()
  await page.addInitScript(() => {
    localStorage.setItem('SAPP_ACTIVE_ROLE', JSON.stringify({ usuario: '100', rol: 'DOCENTE_POSGRADOS' }))
  })
  await page.route('**/*', route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.endsWith('/inicio')) return route.fulfill({ json: { ok: true, data: {
      id: 100, username: 'prueba', fullName: 'Persona Prueba', roles: [],
      clientRoles: ['DOCENTE_POSGRADOS', 'COORDINADOR_POSGRADOS'],
      detalle: { persona: { id: 100, fullName: 'Persona Prueba', attributes: {} } },
    } } })
    if (['fetch', 'xhr'].includes(request.resourceType())) return route.fulfill({ json: { ok: true, data: [] } })
    return url.origin === origin ? route.continue() : route.abort()
  })

  await page.goto(origin)
  const coordinador = page.getByRole('button', { name: 'Rol actual: Coordinador. Cambiar de rol' })
  await coordinador.click()
  const opciones = page.getByRole('listbox', { name: 'Roles asignados' }).getByRole('option')
  assert.deepEqual(await opciones.allTextContents(), ['Coordinador', 'Profesor'])
  await page.getByRole('option', { name: 'Profesor' }).click()
  await page.getByRole('button', { name: 'Rol actual: Profesor. Cambiar de rol' }).waitFor()
  await page.reload()
  await coordinador.waitFor()
})
