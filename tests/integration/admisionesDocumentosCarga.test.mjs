import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

// npm run build primero. APIs sintéticas: no conecta al backend ni al IAM institucional.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const blankPdf = () => {
  let text = '%PDF-1.4\n'
  const offsets = [0]
  for (const [index, body] of [
    '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Resources << >> /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\nendstream',
  ].entries()) {
    offsets.push(Buffer.byteLength(text))
    text += `${index + 1} 0 obj\n${body}\nendobj\n`
  }
  const start = Buffer.byteLength(text)
  text += 'xref\n0 5\n0000000000 65535 f \n'
  text += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  return Buffer.from(`${text}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`).toString('base64')
}
const pdf = blankPdf()
const path = '/admisiones/convocatoria/107/inscripcion/160/documentos'
const checklist = () => [
  { idTipoDocumentoTramite: 1, codigoTipoDocumentoTramite: 'ANX-1', nombreTipoDocumentoTramite: 'Formulario', descripcionTipoDocumentoTramite: 'Formulario de prueba', obligatorioTipoDocumentoTramite: true, documentoCargado: true, tipoTramite: 'ADMISION', documentoUploadedResponse: { idDocumento: 25, nombreArchivoDocumento: 'formulario.pdf', versionDocumento: 1, fechaCargaDocumento: '2026-10-15', estadoDocumento: 'POR_REVISAR', mimeTypeDocumentoContenido: 'application/pdf' } },
  { idTipoDocumentoTramite: 2, codigoTipoDocumentoTramite: 'ANX-4', nombreTipoDocumentoTramite: 'Foto', descripcionTipoDocumentoTramite: 'Foto de prueba', obligatorioTipoDocumentoTramite: true, documentoCargado: true, tipoTramite: 'ADMISION', documentoUploadedResponse: { idDocumento: 26, nombreArchivoDocumento: 'foto.png', versionDocumento: 1, fechaCargaDocumento: '2026-10-15', estadoDocumento: 'POR_REVISAR', mimeTypeDocumentoContenido: 'image/png' } },
  { idTipoDocumentoTramite: 3, codigoTipoDocumentoTramite: 'ANX-5', nombreTipoDocumentoTramite: 'Certificado pendiente', descripcionTipoDocumentoTramite: '', obligatorioTipoDocumentoTramite: true, documentoCargado: false, tipoTramite: 'ADMISION', documentoUploadedResponse: null },
]

test('Admisiones real: carga ligera y archivos individuales', { timeout: 120000 }, async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => new Promise((resolve, reject) => {
    server.httpServer.close(error => error ? reject(error) : resolve())
    server.httpServer.closeAllConnections()
  }))
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ headless: true, channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())

  const scenario = async run => {
    const context = await browser.newContext({ acceptDownloads: true })
    const page = await context.newPage()
    page.setDefaultTimeout(12000)
    const state = { rows: checklist(), lists: [], files: [], decisions: [], failFile: false }
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      const reply = (data, status = 200, message = 'Consulta exitosa') => route.fulfill({ status, json: { ok: status < 400, data, message } })
      if (url.pathname.endsWith('/inicio')) return reply({
        id: 10, uuid: '11111111-1111-1111-1111-111111111111', username: 'coordinacion', firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {}, roles: [], clientRoles: ['COORDINADOR_POSGRADOS'],
        detalle: { aspirante: null, docente: null, estudiante: null, persona: { id: 10, firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {} } },
      })
      if (url.pathname.endsWith('/firmaUsuario/10')) return reply({ titulo: 'MSc.', contenidoFirma: `data:image/png;base64,${png}` })
      if (url.pathname.endsWith('/inscripcionAdmision/convocatoria/107')) return reply([{
        id: 160, aspiranteId: 70, nombreAspirante: 'Aspirante de prueba', estado: 'EN_EVALUACION', fechaInscripcion: '2026-10-15T10:00:00-05:00', periodoAcademico: '2026 - 2', programaAcademico: 'Doctorado', numeroDocumento: '1000000000', emailPersonal: 'aspirante@example.test', telefono: null, foto: null,
      }])
      if (url.pathname.endsWith('/evaluacionAdmision/info')) return reply([])
      if (url.pathname.endsWith('/document')) {
        if (request.method() === 'PUT') {
          const body = request.postDataJSON()
          state.decisions.push(body)
          const item = state.rows.find(row => row.documentoUploadedResponse?.idDocumento === body.documentoId)
          item.documentoUploadedResponse.estadoDocumento = body.aprobado ? 'APROBADO' : 'RECHAZADO'
          item.documentoUploadedResponse.observacionesDocumento = body.observaciones
          return reply(null)
        }
        state.lists.push(url)
        assert.equal(url.searchParams.get('incluirContenido'), 'false')
        if (url.searchParams.get('codigoTipoTramite') === '1001') return reply([{
          ...state.rows[0], documentoUploadedResponse: { ...state.rows[0].documentoUploadedResponse, idDocumento: 27, nombreArchivoDocumento: 'hoja.pdf' },
        }])
        return reply(state.rows)
      }
      const file = url.pathname.match(/\/document\/(25|26|27)$/)
      if (file) {
        const id = Number(file[1])
        state.files.push(id)
        if (state.failFile) return reply(null, 502, 'Archivo temporalmente no disponible')
        return reply({ id, contenidoBase64: id === 26 ? png : pdf, mimeType: id === 26 ? 'image/png' : 'application/pdf', nombreArchivo: id === 26 ? 'foto.png' : id === 27 ? 'hoja.pdf' : 'formulario.pdf' })
      }
      if (['fetch', 'xhr'].includes(request.resourceType())) return reply([])
      if (url.origin !== origin) return route.abort()
      return route.continue()
    })
    try {
      await page.goto(`${origin}${path}`)
      await page.getByText('formulario.pdf', { exact: true }).waitFor()
      await run(page, state, context)
      assert.deepEqual(pageErrors, [])
    } catch (error) {
      console.error('Estado sintético:', await page.locator('body').innerText().catch(() => ''), pageErrors,
        'Listados:', state.lists.map(String), 'Archivos:', state.files)
      throw error
    } finally { await context.close() }
  }

  await t.test('abrir Documentos solo carga metadatos y conserva pendientes', async () => {
    await scenario(async (page, state) => {
      assert.equal(state.lists.length, 1, 'La precarga y la vista comparten la solicitud pendiente')
      assert.equal(state.lists[0].searchParams.get('codigoTipoTramite'), '1002')
      assert.deepEqual(state.files, [])
      await page.getByText('Certificado pendiente', { exact: true }).waitFor()
      assert.equal(await page.locator('.document-row').filter({ hasText: 'Certificado pendiente' }).getByRole('button', { name: 'Ver', exact: true }).isDisabled(), true)
    })
  })

  await t.test('Ver y Descargar solicitan solo el ID elegido, para PDF e imagen', async () => {
    await scenario(async (page, state) => {
      for (const [label, id, name] of [['Formulario', 25, 'formulario.pdf'], ['Foto', 26, 'foto.png']]) {
        const row = page.locator('.document-row').filter({ has: page.getByText(label, { exact: true }) })
        const popupPromise = page.waitForEvent('popup')
        await row.getByRole('button', { name: 'Ver', exact: true }).click()
        const popup = await popupPromise
        await popup.waitForURL('blob:**')
        assert.equal(state.files.at(-1), id)
        await popup.close()
        const downloadPromise = page.waitForEvent('download')
        await row.getByRole('button', { name: 'Descargar', exact: true }).click()
        assert.equal((await downloadPromise).suggestedFilename(), name)
        assert.equal(state.files.at(-1), id)
      }
      assert.deepEqual(state.files, [25, 25, 26, 26])
    })
  })

  await t.test('aprobar y rechazar recargan metadatos sin pedir contenidos', async () => {
    await scenario(async (page, state) => {
      const pdfRow = page.locator('.document-row').filter({ has: page.getByText('Formulario', { exact: true }) })
      await pdfRow.getByRole('button', { name: 'Aprobar', exact: true }).click()
      await page.getByText('Documento aprobado correctamente.').waitFor()
      assert.equal(await pdfRow.getByRole('button', { name: 'Aprobar', exact: true }).isDisabled(), true)
      const imageRow = page.locator('.document-row').filter({ has: page.getByText('Foto', { exact: true }) })
      await imageRow.getByRole('button', { name: 'Rechazar', exact: true }).click()
      await imageRow.getByLabel('Motivo del rechazo').fill('Adjuntar foto legible')
      await imageRow.getByRole('button', { name: 'Confirmar rechazo' }).click()
      await page.getByText('Documento rechazado correctamente.').waitFor()
      assert.deepEqual(state.decisions, [{ documentoId: 25, aprobado: true, observaciones: null }, { documentoId: 26, aprobado: false, observaciones: 'Adjuntar foto legible' }])
      assert.equal(state.lists.length, 3)
      assert.deepEqual(state.files, [])
    })
  })

  await t.test('error de vista cierra pestaña vacía y permite reintentar', async () => {
    await scenario(async (page, state, context) => {
      state.failFile = true
      const row = page.locator('.document-row').filter({ has: page.getByText('Formulario', { exact: true }) })
      const popupPromise = page.waitForEvent('popup')
      const dialogPromise = new Promise(resolve => page.once('dialog', async dialog => {
        assert.equal(dialog.message(), 'Archivo temporalmente no disponible')
        await dialog.accept(); resolve()
      }))
      await row.getByRole('button', { name: 'Ver', exact: true }).click()
      const popup = await popupPromise
      await dialogPromise
      if (!popup.isClosed()) await popup.waitForEvent('close')
      assert.equal(context.pages().length, 1)
      state.failFile = false
      const downloadPromise = page.waitForEvent('download')
      await row.getByRole('button', { name: 'Descargar', exact: true }).click()
      assert.equal((await downloadPromise).suggestedFilename(), 'formulario.pdf')
    })
  })

  await t.test('hoja de vida carga al abrir su sección y reutiliza la vista previa', async () => {
    await scenario(async (page, state) => {
      assert.equal(state.lists.some(url => url.searchParams.get('codigoTipoTramite') === '1001'), false)
      await page.getByRole('button', { name: /^Hoja de vida/ }).click()
      await page.getByTitle('Previsualización de hoja de vida').waitFor()
      assert.deepEqual(state.files, [27])
      assert.equal(state.lists.at(-1).searchParams.get('codigoTipoDocumentoTramite'), 'ANX-2')
      await page.getByRole('button', { name: /^Documentos cargados/ }).click()
      await page.getByText('formulario.pdf', { exact: true }).waitFor()
      await page.getByRole('button', { name: /^Hoja de vida/ }).click()
      await page.getByTitle('Previsualización de hoja de vida').waitFor()
      assert.deepEqual(state.files, [27])
      assert.equal(state.lists.filter(url => url.searchParams.get('codigoTipoTramite') === '1001').length, 1)
    })
  })
})
