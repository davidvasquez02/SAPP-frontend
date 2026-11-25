import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

const { chromium } = createRequire(import.meta.url)(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')

test('el panel de inclusiones alinea materias y acciones en escritorio y móvil', async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => {
    server.httpServer.close()
    server.httpServer.closeAllConnections()
  })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.route('**/*', route => {
    const request = route.request()
    const url = new URL(request.url())
    const reply = data => route.fulfill({ json: { ok: true, data } })
    if (url.pathname.endsWith('/inicio')) return reply({
      id: 100, username: 'prueba', fullName: 'Persona Prueba', roles: [], clientRoles: ['ESTUDIANTE_POSGRADOS'],
      detalle: { estudiante: { id: 18, programaId: 1 }, persona: { id: 100, fullName: 'Persona Prueba', attributes: {} } },
    })
    if (url.pathname.endsWith('/vigente/estudiante/18')) return reply([{
      id: 24, estudianteId: 18, periodoId: 7, periodoAcademico: '2027-1', estado: 'FINALIZADA',
      asignaturas: [{ id: 40, asignaturaId: 1, asignaturaNombre: 'Propuesta de Tesis Doctoral I', estado: 'MATRICULADA' }],
    }])
    if (url.pathname.endsWith('/periodoAcademicoFecha/vigente')) return reply([{
      tipoTramite: { nombre: 'INCLUSION_CANCELACION_MATRICULA' }, periodo: { id: 7 }, fechaFin: '2027-06-25',
    }])
    if (['fetch', 'xhr'].includes(request.resourceType())) return reply([])
    return url.origin === origin ? route.continue() : route.abort()
  })

  await page.goto(`${origin}/matricula/academica`)
  await page.getByRole('button', { name: 'Solicitar inclusión o cancelación de materias' }).click()
  const panel = page.getByRole('region', { name: 'Inclusión y cancelación de materias' })
  const opcion = panel.getByRole('checkbox', { name: 'Propuesta de Tesis Doctoral I' })
  await opcion.waitFor()

  for (const [width, theme] of [[1440, 'light'], [375, 'dark']]) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(theme => {
      document.body.classList.remove('light', 'dark')
      document.body.classList.add(theme)
    }, theme)
    const panelBox = await panel.boundingBox()
    const label = panel.getByText('Propuesta de Tesis Doctoral I', { exact: true })
    const checkboxBox = await opcion.boundingBox()
    const labelBox = await label.boundingBox()
    assert.ok(Math.abs(checkboxBox.y + checkboxBox.height / 2 - labelBox.y - labelBox.height / 2) < 3)
    assert.ok(panelBox.x + panelBox.width <= width)
    for (const name of ['Cerrar', 'Enviar solicitud']) {
      const box = await panel.getByRole('button', { name, exact: true }).boundingBox()
      assert.ok(box.height >= 44 && box.x + box.width <= panelBox.x + panelBox.width)
    }
  }

  await panel.getByText('Propuesta de Tesis Doctoral I', { exact: true }).click()
  assert.ok(await opcion.isChecked())
  assert.ok(await panel.getByRole('button', { name: 'Enviar solicitud' }).isEnabled())
})
