import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

// npm run build primero. APIs y navegación con datos sintéticos; sin backend/IAM reales.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const fotoUrl = `data:image/png;base64,${png}`
const estudianteInicial = {
  id: 42, idAspirante: null, codigo: '20260001', codigoEstudianteUis: '20260001',
  nombreCompleto: 'Persona Inicial', fotoUrl, tipoDocumento: 'CC', numeroDocumento: '123',
  correoInstitucional: 'persona@example.test', correoPersonal: 'persona@example.test',
  directorTg: null, personaId: 42, personaIdpId: null, estadoAcademico: 'ACTIVO',
  cohorte: '20261', promedioAcumulado: 0, creditosAprobados: 0, creditosPendientes: 0,
  programaId: 1, programaNombre: 'Maestría', fechaIngreso: '2026-01-15',
}
const perfil = (id = 42) => ({
  estudiante: { id, idAspirante: null, codigoEstudianteUis: `202600${id}`, cohorte: 20261,
    estado: 'ACTIVO', fechaIngreso: '2026-01-15', fechaEgreso: null, foto: null },
  nombreCompleto: `Persona Actualizada ${id}`, numeroDocumento: '123',
  correoInstitucional: 'persona@example.test', correoPersonal: 'persona@example.test',
  directorTg: null, persona: { id, idpId: null }, programaId: 1, programaCodigoNombre: 'Maestría',
})
const documentos = [
  { tipoTramite: 'MATRICULA', periodo: '2026-1', tramiteId: 5,
    documentos: [{ id: 101, tipoDocumento: 'Matrícula de prueba', nombreArchivo: 'matricula.pdf', estado: 'APROBADO', documentoCargado: true }] },
  { tipoTramite: 'ADMISION_ASPIRANTE', periodo: null, tramiteId: 7,
    documentos: [{ id: 102, tipoDocumento: 'Admisión de prueba', nombreArchivo: 'admision.pdf', estado: 'APROBADO', documentoCargado: true }] },
]
const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

test('detalle del estudiante conserva foto y completa documentos al actualizar perfil', { timeout: 120000 }, async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => new Promise((resolve, reject) => {
    server.httpServer.close(error => error ? reject(error) : resolve())
    server.httpServer.closeAllConnections()
  }))
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ headless: true, channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())

  const scenario = async (run, { fromList = true, data = documentos, status = 200, embeddedPhoto = false } = {}) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    page.setDefaultTimeout(5000)
    const profileGate = deferred()
    const documentsGate = deferred()
    const docsStarted = deferred()
    const state = { documentRequests: 0, profileGate, documentsGate, docsStarted }
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    if (fromList) await page.addInitScript(estudiante => {
      // React Router guarda el estado de la tarjeta bajo usr en history.state.
      history.replaceState({ usr: { estudiante }, key: 'prueba', idx: 0 }, '')
    }, estudianteInicial)
    await page.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      const reply = (data, status = 200) => route.fulfill({ status, json: { ok: status < 400, data, message: status < 400 ? 'Consulta exitosa' : 'Error documental de prueba' } })
      if (url.pathname.endsWith('/inicio')) return reply({
        id: 100, uuid: '11111111-1111-1111-1111-111111111111', username: 'prueba', firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {}, roles: [], clientRoles: ['COORDINADOR_POSGRADOS'],
        detalle: { aspirante: null, docente: null, estudiante: null, persona: { id: 100, fullName: 'Persona Prueba', attributes: {} } },
      })
      if (url.pathname.endsWith('/estudiantes/consulta')) {
        if (!url.searchParams.has('estudianteId')) return reply([])
        const id = Number(url.searchParams.get('estudianteId'))
        if (id === 42) await profileGate.promise
        const result = perfil(id)
        if (embeddedPhoto) result.estudiante.foto = { contenidoBase64: png, mimeType: 'image/jpeg' }
        return reply([result])
      }
      if (url.pathname.includes('/document/by-estudiante-id/')) {
        state.documentRequests++
        const id = Number(url.pathname.split('/').at(-1))
        if (id !== 42) return reply([])
        docsStarted.resolve()
        await documentsGate.promise
        return reply(data, status)
      }
      if (url.pathname.endsWith('/estudiantes/42/estado')) return reply(null)
      if (['fetch', 'xhr'].includes(request.resourceType())) return reply([])
      if (url.origin !== origin) return route.abort()
      return route.continue()
    })
    try {
      await page.goto(`${origin}/coordinacion/estudiantes/42`)
      await run(page, state)
      assert.deepEqual(errors, [])
    } finally {
      profileGate.resolve()
      documentsGate.resolve()
      await context.close()
    }
  }

  const comprobarDocumentos = async page => {
    await page.getByText('Matrícula de prueba', { exact: true }).waitFor()
    await page.getByRole('tab', { name: 'Admisión', exact: true }).click()
    await page.getByText('Admisión de prueba', { exact: true }).waitFor()
    await page.getByRole('tab', { name: 'Matrículas', exact: true }).click()
    await page.getByText('Matrícula de prueba', { exact: true }).waitFor()
    assert.equal(await page.getByText('Cargando documentos del estudiante...').count(), 0)
  }

  await t.test('documentos tardíos se muestran aunque primero se actualice el perfil', async () => {
    await scenario(async (page, state) => {
      await state.docsStarted.promise
      state.profileGate.resolve()
      await page.getByRole('heading', { name: 'Persona Actualizada 42', exact: true }).waitFor()
      state.documentsGate.resolve()
      await comprobarDocumentos(page)
      assert.equal(state.documentRequests, 1)
    })
  })

  await t.test('foto del listado permanece tras refrescar perfil y cambiar estado', async () => {
    await scenario(async (page, state) => {
      const photo = page.locator('.estudiante-detalle__profile-photo')
      await photo.waitFor()
      assert.equal(await photo.getAttribute('src'), fotoUrl)
      await state.docsStarted.promise
      state.profileGate.resolve()
      await page.getByRole('heading', { name: 'Persona Actualizada 42', exact: true }).waitFor()
      assert.equal(await photo.getAttribute('src'), fotoUrl)
      await page.getByRole('button', { name: 'Inactivar estudiante', exact: true }).click()
      await page.getByText('El estudiante ahora está inactivo.', { exact: true }).waitFor()
      state.documentsGate.resolve()
      await comprobarDocumentos(page)
      assert.equal(await photo.getAttribute('src'), fotoUrl)
      assert.equal(state.documentRequests, 1)
    })
  })

  await t.test('documentos que llegan antes del perfil permanecen al actualizarlo', async () => {
    await scenario(async (page, state) => {
      await state.docsStarted.promise
      state.documentsGate.resolve()
      await comprobarDocumentos(page)
      state.profileGate.resolve()
      await page.getByRole('heading', { name: 'Persona Actualizada 42', exact: true }).waitFor()
      await comprobarDocumentos(page)
      assert.equal(state.documentRequests, 1)
    })
  })

  await t.test('respuesta vacía y error tardío terminan el indicador de carga', async () => {
    for (const status of [200, 502]) await scenario(async (page, state) => {
      await state.docsStarted.promise
      state.profileGate.resolve()
      await page.getByRole('heading', { name: 'Persona Actualizada 42', exact: true }).waitFor()
      state.documentsGate.resolve()
      await page.getByText(status === 200 ? 'No hay documentos de matrícula registrados para este estudiante.' : 'Error documental de prueba', { exact: true }).waitFor()
      assert.equal(await page.getByText('Cargando documentos del estudiante...').count(), 0)
    }, { data: [], status })
  })

  await t.test('acceso directo usa foto del servidor y carga documentos', async () => {
    await scenario(async (page, state) => {
      state.profileGate.resolve()
      await state.docsStarted.promise
      state.documentsGate.resolve()
      await comprobarDocumentos(page)
      assert.equal(await page.locator('.estudiante-detalle__profile-photo').getAttribute('src'), `data:image/jpeg;base64,${png}`)
    }, { fromList: false, embeddedPhoto: true })
  })
})
