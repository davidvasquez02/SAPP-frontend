import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')

test('coordinación edita el mensaje visualmente y conserva el formato de la plantilla', async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => new Promise(resolve => {
    server.httpServer.close(resolve)
    server.httpServer.closeAllConnections()
  }))
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())

  const page = await browser.newPage()
  const persona = { id: 100, firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', attributes: {} }
  let plantilla = {
    id: 5, sigla: 'PRUEBA', nombre: 'Admisión', asunto: 'Hola {{nombre}}', idioma: 'ES', descripcion: '',
    contenidoHtml: '<p style="text-align:center">Hola {{nombre}}</p><p><a href="https://example.test/anterior">Inscripción</a></p><p>Requisitos</p>',
  }
  let pruebas = 0
  await page.route('**/*', route => {
    const req = route.request()
    const url = new URL(req.url())
    const reply = (data, message) => route.fulfill({ json: { ok: true, data, message } })
    if (url.pathname.endsWith('/inicio')) {
      return reply({ ...persona, username: 'prueba', roles: [], clientRoles: ['COORDINADOR_POSGRADOS'], detalle: { persona } })
    }
    if (url.pathname.endsWith('/plantillasCorreo/5/prueba')) {
      assert.equal(req.method(), 'POST')
      pruebas++
      return reply(null, 'Prueba simulada')
    }
    if (url.pathname.endsWith('/plantillasCorreo/5')) {
      if (req.method() === 'PUT') plantilla = { ...plantilla, ...req.postDataJSON() }
      return reply(plantilla)
    }
    if (['fetch', 'xhr'].includes(req.resourceType())) return reply([])
    return url.origin === origin ? route.continue() : route.abort()
  })

  await page.goto(origin + '/administracion-academica/plantillas-correo/5/editar')
  const campoAsunto = page.locator('.plantillas-correo__campo').filter({
    has: page.locator('.plantillas-correo__campo-etiqueta').filter({ hasText: /^Asunto/ }),
  })
  await campoAsunto.getByRole('button', { name: 'Editar' }).click()
  await campoAsunto.getByRole('textbox', { name: 'Asunto' }).fill('Bienvenida, ')
  await page.getByLabel('Insertar dato en el asunto').selectOption('nombre')
  assert.equal(await campoAsunto.getByRole('textbox', { name: 'Asunto' }).inputValue(), 'Bienvenida, {{nombre}}')
  await page.getByText(/Bienvenida, Laura Gómez/).waitFor()
  await campoAsunto.getByRole('button', { name: 'Listo', exact: true }).click()
  const campo = page.locator('.plantillas-correo__campo').filter({ has: page.getByText('Mensaje', { exact: true }) })
  await campo.getByRole('button', { name: 'Editar' }).click()
  const mensaje = page.frameLocator('iframe[title="Editor del mensaje"]').getByRole('textbox', { name: 'Mensaje del correo' })
  assert.equal(await mensaje.locator('[data-dato-editor]').innerText(), 'Nombre')
  const seleccionar = (texto) => mensaje.evaluate((editor, texto) => {
    const nodo = [...editor.querySelectorAll('p, a')].find(elemento => elemento.textContent === texto && elemento.firstChild?.nodeType === 3)
    editor.focus()
    const rango = editor.ownerDocument.createRange()
    rango.selectNodeContents(nodo)
    const seleccion = editor.ownerDocument.getSelection()
    seleccion.removeAllRanges()
    seleccion.addRange(rango)
    editor.ownerDocument.dispatchEvent(new Event('selectionchange'))
  }, texto)
  await seleccionar('Inscripción')
  await page.getByRole('button', { name: 'Enlace', exact: true }).click()
  await page.getByRole('textbox', { name: 'Dirección del enlace' }).fill('sin-protocolo')
  await page.getByRole('button', { name: 'Aplicar enlace' }).click()
  await page.getByText(/Escribe una dirección válida/).waitFor()
  await page.getByRole('textbox', { name: 'Dirección del enlace' }).fill('https://example.test/nuevo')
  await page.getByRole('button', { name: 'Aplicar enlace' }).click()
  await seleccionar('Requisitos')
  await page.getByRole('button', { name: 'Negrita' }).click()
  await page.getByRole('button', { name: 'Lista', exact: true }).click()
  await mensaje.press('Control+End')
  await mensaje.press('Space')
  await page.getByLabel('Insertar dato en el mensaje').selectOption('nombre')
  assert.equal(await mensaje.locator('[data-dato-editor]').count(), 2)
  await page.frameLocator('iframe[title="Vista previa del correo"]').getByText(/Hola Laura Gómez/).waitFor()
  await page.getByRole('button', { name: 'Listo', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: 'Enviar correo de prueba' }).isDisabled(), true)
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar y guardar' }).click()
  await page.getByText('Cambios guardados correctamente.').waitFor()
  assert.match(plantilla.contenidoHtml, /style="text-align:center"/)
  assert.match(plantilla.contenidoHtml, /href="https:\/\/example.test\/nuevo"/)
  assert.match(plantilla.contenidoHtml, /<b>Requisitos/)
  assert.match(plantilla.contenidoHtml, /<ul>/)
  assert.equal(plantilla.contenidoHtml.match(/\{\{nombre\}\}/g)?.length, 2)
  assert.equal(plantilla.asunto, 'Bienvenida, {{nombre}}')
  assert.doesNotMatch(plantilla.contenidoHtml, /data-dato-editor/)
  await page.getByRole('button', { name: 'Enviar correo de prueba' }).click()
  await page.getByText('Prueba simulada').waitFor()
  assert.equal(pruebas, 1)
})
