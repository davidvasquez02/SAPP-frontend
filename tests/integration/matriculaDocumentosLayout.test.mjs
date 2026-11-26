import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

const { chromium } = createRequire(import.meta.url)(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')

test('los documentos finalizados muestran acciones juntas y se adaptan a móvil', async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => {
    server.httpServer.close()
    server.httpServer.closeAllConnections()
  })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())
  const page = await browser.newPage({ viewport: { width: 1440, height: 769 } })
  let estado = 'FINALIZADA'
  let asignaturas = []
  const decisiones = []
  await page.route('**/*', route => {
    const request = route.request()
    const url = new URL(request.url())
    const reply = data => route.fulfill({ json: { ok: true, data } })
    if (url.pathname.endsWith('/inicio')) return reply({
      id: 100, username: 'prueba', fullName: 'Persona Prueba', roles: [], clientRoles: ['COORDINADOR_POSGRADOS'],
      detalle: { persona: { id: 100, fullName: 'Persona Prueba', attributes: {} } },
    })
    if (url.pathname.endsWith('/matriculaAcademica')) return reply([{
      id: 24, estudianteId: 17, estudianteNombreCompleto: 'Persona Prueba', estado, asignaturas,
    }])
    if (url.pathname.includes('/matriculaAcademica/24/inclusionCancelacion/')) {
      const id = Number(url.pathname.split('/').at(-1))
      const { aprobado } = request.postDataJSON()
      decisiones.push({ id, aprobado })
      asignaturas = asignaturas.map(item => item.id === id
        ? { ...item, estado: aprobado ? 'MATRICULADA' : 'CANCELACION_RECHAZADA' }
        : item)
      if (decisiones.length === 2) estado = 'FINALIZADA'
      return reply({ id: 24, estado, asignaturas })
    }
    if (url.pathname.endsWith('/document')) return reply([{
      idTipoDocumentoTramite: 5, nombreTipoDocumentoTramite: 'Certificado EPS',
      descripcionTipoDocumentoTramite: 'Certificado Eps', obligatorioTipoDocumentoTramite: true, documentoCargado: true,
      documentoUploadedResponse: { idDocumento: 50, nombreArchivoDocumento: '0004_20261123_Certificado_Eps_2027-1.pdf',
        estadoDocumento: 'APROBADO', base64DocumentoContenido: 'JVBERi0=', mimeTypeDocumentoContenido: 'application/pdf' },
    }])
    if (['fetch', 'xhr'].includes(request.resourceType())) return reply([])
    return url.origin === origin ? route.continue() : route.abort()
  })

  await page.goto(`${origin}/matricula/academica/24`)
  const documentos = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Documentos de la matrícula' }) })
  const ver = documentos.getByRole('button', { name: 'Ver', exact: true })
  const descargar = documentos.getByRole('button', { name: 'Descargar' })
  await ver.waitFor()
  assert.equal(await documentos.getByText('Certificado Eps', { exact: true }).count(), 0)
  assert.equal(await documentos.getByText('Validación', { exact: true }).count(), 0)
  assert.equal((await ver.boundingBox()).y, (await descargar.boundingBox()).y)
  const archivo = await documentos.getByText('0004_20261123_Certificado_Eps_2027-1.pdf', { exact: true }).boundingBox()
  assert.ok(archivo.x < (await ver.boundingBox()).x)

  estado = 'PENDIENTE_DOCUMENTOS'
  await page.reload()
  await documentos.getByText('Validación', { exact: true }).waitFor()
  assert.equal((await ver.boundingBox()).y, (await descargar.boundingBox()).y)
  await page.setViewportSize({ width: 375, height: 769 })
  await page.evaluate(() => document.body.classList.replace('light', 'dark'))
  const vistaMovil = await ver.boundingBox()
  const descargaMovil = await descargar.boundingBox()
  assert.equal(vistaMovil.y, descargaMovil.y)
  assert.ok(vistaMovil.height >= 44 && descargaMovil.x + descargaMovil.width <= 375)

  estado = 'INCLUSION_POR_VALIDAR'
  asignaturas = [
    { id: 31, asignaturaId: 1, asignaturaNombre: 'Investigación', estado: 'INCLUSION_SOLICITADA' },
    { id: 32, asignaturaId: 2, asignaturaNombre: 'Seminario', estado: 'CANCELACION_SOLICITADA' },
  ]
  await page.reload()
  const solicitudes = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Solicitudes de inclusión y cancelación pendientes' }),
  })
  const guardar = solicitudes.getByRole('button', { name: 'Guardar decisiones de inclusión y cancelación' })
  await guardar.waitFor()
  assert.ok(await guardar.isDisabled())
  const inclusion = solicitudes.getByRole('row', { name: /Investigación/ })
  await inclusion.getByRole('button', { name: 'Aprobar' }).click()
  assert.equal(await inclusion.getByRole('button', { name: 'Aprobada' }).getAttribute('aria-pressed'), 'true')
  await solicitudes.getByRole('row', { name: /Seminario/ }).getByRole('button', { name: 'Rechazar' }).click()
  assert.deepEqual(decisiones, [])
  await guardar.click()
  await page.getByText('Decisiones guardadas correctamente.').waitFor()
  assert.deepEqual(decisiones, [{ id: 31, aprobado: true }, { id: 32, aprobado: false }])
  assert.ok(await page.getByText('Finalizada', { exact: true }).isVisible())
})
