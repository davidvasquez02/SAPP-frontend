import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

// npm run build primero. APIs sintéticas; sin registros, invitaciones o correos reales.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')
const routePath = '/trabajos-grado/doctorado/solicitudes/42'

test('solo agregar evaluadores reutiliza documentos; las demás acciones conservan su recarga', { timeout: 120000 }, async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => new Promise((resolve, reject) => {
    server.httpServer.close(error => error ? reject(error) : resolve())
    server.httpServer.closeAllConnections()
  }))
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ headless: true, channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())

  const scenario = async (run, { student = false, failDocuments = false } = {}) => {
    const context = await browser.newContext({ acceptDownloads: true })
    const page = await context.newPage()
    page.setDefaultTimeout(8000)
    const state = {
      documentsGets: 0, processGets: 0, historyGets: 0, mutations: 0, failDocuments,
      fileId: 101, fileName: 'tesis-original.pdf',
      proceso: { id: 9, solicitudAcademicaId: 42, tipoSolicitudCodigo: 'DEF_TESIS_DCC', titulo: 'Tesis de prueba', programa: 'Doctorado',
        estadoSolicitud: student ? 'EN_AJUSTES' : 'JUR_POR_DESIG', documentoEvaluarId: 101, documentoEvaluarNombre: 'tesis-original.pdf',
        fechaLimiteEvaluacion: '2027-12-01', jurados: [] },
    }
    const solicitud = () => ({ id: 42, estudianteId: 10, estudiante: 'Estudiante de prueba', codigoEstudianteUis: '20260001', programaAcademico: 'Doctorado', tipoSolicitudId: 9, tipoSolicitudCodigo: 'DEF_TESIS_DCC', tipoSolicitud: 'Defensa de tesis doctoral', tipoTramiteCodigo: '1008', estadoId: student ? 16 : 15, estadoSigla: state.proceso.estadoSolicitud, estado: state.proceso.estadoSolicitud, fechaRegistro: '2026-10-16', fechaResolucion: null, observaciones: null })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      const reply = (data, status = 200) => route.fulfill({ status, json: { ok: status < 400, data, message: status < 400 ? 'Consulta exitosa' : 'Error documental de prueba' } })
      if (url.pathname.endsWith('/inicio')) return reply({
        id: 100, uuid: '11111111-1111-1111-1111-111111111111', username: 'prueba', firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {}, roles: [], clientRoles: [student ? 'ESTUDIANTE_POSGRADOS' : 'COORDINADOR_POSGRADOS'],
        detalle: { aspirante: null, docente: null, estudiante: student ? { id: 10, programaId: 1, codigoEstudianteUis: '20260001' } : null, persona: { id: 100, firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {} } },
      })
      if (url.pathname.endsWith('/solicitudesAcademicas/42')) return reply(solicitud())
      if (url.pathname.endsWith('/solicitudesAcademicas/estudiante')) return reply([solicitud()])
      if (url.pathname.endsWith('/solicitudesAcademicas/42/historial')) {
        state.historyGets++
        return reply(state.mutations ? [{ estadoNuevoSigla: state.proceso.estadoSolicitud, estadoNuevo: 'Jurado actualizado', fecha: '2026-10-16T10:00:00', responsable: 'Coordinación', detalle: `Cambio ${state.mutations}` }] : [])
      }
      if (url.pathname.endsWith('/document')) {
        if (request.method() === 'POST') {
          const payload = request.postDataJSON()
          state.fileId = 102
          state.fileName = payload.nombreArchivo
          return reply({ id: state.fileId })
        }
        state.documentsGets++
        if (state.failDocuments) return reply(null, 502)
        return reply([{ idTipoDocumentoTramite: 37, codigoTipoDocumentoTramite: 'ANX-26', nombreTipoDocumentoTramite: 'Tesis', descripcionTipoDocumentoTramite: 'Documento de tesis', obligatorioTipoDocumentoTramite: true, documentoCargado: true,
          documentoUploadedResponse: { idDocumento: state.fileId, nombreArchivoDocumento: state.fileName, mimeTypeDocumentoContenido: 'application/pdf', base64DocumentoContenido: 'JVBERi0xLjQKJSVFT0YK' } }])
      }
      if (url.pathname.endsWith('/procesoEvaluacionTg/catalogos')) return reply({ modalidades: [], estadosInvitacion: [], momentos: [], conceptos: [], resultados: [] })
      if (url.pathname.endsWith('/procesoEvaluacionTg/solicitud/42')) { state.processGets++; return reply(state.proceso) }
      if (url.pathname.includes('/procesoEvaluacionTg/solicitud/42/documento-evaluar/')) {
        state.proceso.documentoEvaluarId = Number(url.pathname.split('/').at(-1))
        state.proceso.documentoEvaluarNombre = state.fileName
        return reply(state.proceso)
      }
      if (url.pathname.endsWith('/procesoEvaluacionTg/solicitud/42/jurados')) {
        const payload = request.postDataJSON()
        assert.equal(payload.documentoEvaluarId, state.fileId)
        state.mutations++
        state.proceso.estadoSolicitud = 'JUR_INVITADO'
        state.proceso.jurados.push({ ...payload.jurados[0], id: state.mutations, activo: true, estadoInvitacion: 'PENDIENTE', evaluaciones: [] })
        return reply(state.proceso)
      }
      const jurado = url.pathname.match(/\/jurados\/(\d+)(\/reenviar-invitacion)?$/)
      if (jurado) {
        state.mutations++
        const item = state.proceso.jurados.find(item => item.id === Number(jurado[1]))
        if (request.method() === 'PUT') Object.assign(item, request.postDataJSON())
        if (request.method() === 'DELETE') item.activo = false
        return reply(state.proceso)
      }
      if (url.pathname.endsWith('/procesoEvaluacionTg/solicitud/42/recordatorios')) { state.mutations++; return reply(1) }
      if (['fetch', 'xhr'].includes(request.resourceType())) return reply([])
      if (url.origin !== origin) return route.abort()
      return route.continue()
    })
    try {
      await page.goto(`${origin}${routePath}`)
      await run(page, state)
      assert.deepEqual(errors, [])
    } catch (error) {
      console.error(await page.locator('body').innerText(), errors)
      throw error
    } finally { await context.close() }
  }

  const completarJurado = async (page, nombre) => {
    const form = page.locator('.evaluacion-tg__form-card')
    await form.getByLabel('Nombre *', { exact: true }).fill(nombre)
    await form.getByLabel('Correo *', { exact: true }).fill(`${nombre.toLowerCase()}@example.test`)
    await form.getByLabel('Institución *', { exact: true }).fill('Universidad de prueba')
    return form
  }

  await t.test('solo agregar omite documentos; reemplazar, reenviar, retirar y recordar sí consultan', async () => {
    await scenario(async (page, state) => {
      await page.locator('.documentos-adjuntos__filename').filter({ hasText: 'tesis-original.pdf' }).waitFor()
      await page.getByRole('button', { name: 'Agregar evaluador' }).waitFor()
      const initialDocs = state.documentsGets
      const initialProcess = state.processGets
      const initialHistory = state.historyGets
      for (const nombre of ['EvaluadorUno', 'EvaluadorDos']) {
        await page.getByRole('button', { name: 'Agregar evaluador' }).click()
        const form = await completarJurado(page, nombre)
        await form.getByLabel('Documento a evaluar *').selectOption('101')
        await form.getByRole('button', { name: 'Guardar jurado', exact: true }).click()
        await page.getByRole('status').filter({ hasText: 'Jurado registrado e invitación enviada.' }).waitFor()
        await page.getByRole('row').filter({ hasText: nombre }).waitFor()
        assert.equal(state.documentsGets, initialDocs)
      }
      const firstRow = page.getByRole('row').filter({ hasText: 'EvaluadorUno' })
      await firstRow.getByRole('button', { name: 'Reemplazar', exact: true }).click()
      const form = await completarJurado(page, 'Reemplazo')
      await form.getByRole('button', { name: 'Reemplazar e invitar' }).click()
      await page.getByRole('status').filter({ hasText: 'El jurado fue reemplazado' }).waitFor()
      assert.equal(state.documentsGets, initialDocs + 1)
      const row = page.getByRole('row').filter({ hasText: 'Reemplazo' })
      await row.getByRole('button', { name: 'Reenviar', exact: true }).click()
      await page.getByRole('status').filter({ hasText: 'Invitación reenviada.' }).waitFor()
      assert.equal(state.documentsGets, initialDocs + 2)
      await page.getByRole('button', { name: 'Enviar recordatorios', exact: true }).click()
      await page.getByRole('status').filter({ hasText: 'Se enviaron 1 recordatorio(s).' }).waitFor()
      assert.equal(state.documentsGets, initialDocs + 3)
      await row.getByRole('button', { name: 'Retirar', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Sí, retirar jurado', exact: true }).click()
      await page.getByRole('status').filter({ hasText: 'Jurado retirado.' }).waitFor()
      assert.equal(state.documentsGets, initialDocs + 4)
      assert.ok(state.processGets > initialProcess)
      assert.ok(state.historyGets > initialHistory)
      await page.getByText('Cambio 6', { exact: true }).first().waitFor()
      assert.equal(await page.getByRole('button', { name: 'Descargar tesis-original.pdf', exact: true }).isEnabled(), true)
      const download = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Descargar tesis-original.pdf', exact: true }).click()
      assert.equal((await download).suggestedFilename(), 'tesis-original.pdf')
    })
  })

  await t.test('el reintento documental explícito sigue consultando el servicio', async () => {
    await scenario(async (page, state) => {
      await page.locator('.documentos-adjuntos').getByText('Error documental de prueba').waitFor()
      const before = state.documentsGets
      state.failDocuments = false
      await page.locator('.documentos-adjuntos').getByRole('button', { name: 'Reintentar', exact: true }).click()
      await page.locator('.documentos-adjuntos__filename').filter({ hasText: 'tesis-original.pdf' }).waitFor()
      assert.equal(state.documentsGets, before + 1)
    }, { failDocuments: true })
  })

  await t.test('subir una versión corregida sí recarga la lista y muestra el archivo nuevo', async () => {
    await scenario(async (page, state) => {
      const panel = page.locator('.ajustes-estudiante')
      await panel.locator('input[type=file]').waitFor()
      const before = state.documentsGets
      await panel.locator('input[type=file]').setInputFiles({ name: 'tesis-corregida.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') })
      await panel.getByRole('button', { name: 'Cargar archivo nuevamente', exact: true }).click()
      await page.locator('.documentos-adjuntos__filename').filter({ hasText: 'tesis-corregida.pdf' }).waitFor()
      assert.ok(state.documentsGets > before)
      assert.equal(state.proceso.documentoEvaluarId, 102)
    }, { student: true })
  })
})
