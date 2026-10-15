import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { preview } from 'vite'

// Prueba con navegador y datos sintéticos. No conecta al backend ni al IAM.
// SAPP_PLAYWRIGHT_MODULE permite reutilizar Playwright del runtime de Codex, sin instalar dependencias.
// Ejecutar npm run build primero: se comprueba el bundle de producción, sin optimización de dependencias al navegar.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const sinDirector = { estudianteId: 42, puedeAsignar: true, grupo: { id: 5, nombre: 'Grupo A' }, director: null }
const conDirector = { ...sinDirector, puedeAsignar: false, director: { id: 20, nombreCompleto: 'ANA TORRES', correo: 'ana@example.test' } }

test('perfil real: selección dependiente, errores, guardado, firma y persistencia', { timeout: 120000 }, async (t) => {
  const server = await preview({
    configFile: false,
    preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error',
  })
  t.after(() => new Promise((resolve, reject) => {
    server.httpServer.close(error => error ? reject(error) : resolve())
    server.httpServer.closeAllConnections()
  }))
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ headless: true, channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())

  const scenario = async (run, initial = sinDirector) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const state = { asignacion: structuredClone(initial), puts: [], signaturePosts: [], errorGet: false, errorGroups: false, errorSave: false, conflict: false, slowGroup: false }
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      const reply = (data, status = 200, message = 'Consulta exitosa') => route.fulfill({ status, json: { ok: status < 400, data, message } })
      if (url.pathname.endsWith('/inicio')) return reply({
        id: 10, uuid: '11111111-1111-1111-1111-111111111111', username: 'estudiante', firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {}, roles: [], clientRoles: ['ESTUDIANTE_POSGRADOS'],
        detalle: { aspirante: null, docente: null, persona: { id: 10, firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {} },
          estudiante: { id: 42, codigoEstudianteUis: '20260001', cohorte: 20261, estado: 'ACTIVO', fechaIngreso: '2026-01-15', programaId: 1, programaCodigoNombre: 'Maestría', idAspirante: 7, directorTg: state.asignacion.director } },
      })
      if (url.pathname.endsWith('/estudiantes/42/director-grado')) {
        if (request.method() === 'PUT') {
          state.puts.push(request.postDataJSON())
          await new Promise(resolve => setTimeout(resolve, 150))
          if (state.conflict) { state.asignacion = structuredClone(conDirector); return reply(null, 409, 'Ya tienes un director de grado asignado.') }
          if (state.errorSave) return reply(null, 502, 'No fue posible validar el docente; reintenta.')
          state.asignacion = structuredClone(conDirector)
          return reply(state.asignacion)
        }
        if (state.errorGet) return reply(null, 502, 'Consulta no disponible')
        return reply(state.asignacion)
      }
      if (url.pathname.endsWith('/gruposInvestigacionDocentes')) {
        assert.equal(url.searchParams.get('soloPosgrados'), 'true')
        const id = url.searchParams.get('grupoId')
        if (state.slowGroup && id === '5') await new Promise(resolve => setTimeout(resolve, 350))
        return reply(id === '6' ? [] : [{ id: 20, nombre: 'ANA TORRES', existeEnSapp: true, esDirector: false, uuid: null }])
      }
      if (url.pathname.endsWith('/gruposInvestigacion')) {
        if (state.errorGroups) return reply(null, 502, 'Grupos no disponibles')
        return reply([{ id: 5, codigoNombre: 'Grupo A' }, { id: 6, codigoNombre: 'Grupo vacío' }])
      }
      if (url.pathname.endsWith('/firmaUsuario/10')) {
        if (request.method() === 'POST') { state.signaturePosts.push(request.postDataJSON()); return reply(null) }
        return reply({ titulo: '', contenidoFirma: `data:image/png;base64,${png}` })
      }
      if (['fetch', 'xhr'].includes(request.resourceType())) return reply([])
      if (url.origin !== origin) return route.abort()
      return route.continue()
    })
    try {
      await page.goto(`${origin}/perfil`)
      await page.getByRole('heading', { name: 'Información académica' }).waitFor()
      await run(page, state)
      assert.deepEqual(errors, [])
    } catch (error) {
      console.error('Estado del perfil de prueba:', await page.locator('body').innerText().catch(() => ''), errors)
      throw error
    } finally { await context.close() }
  }

  await t.test('preselecciona grupo, bloquea envío doble y conserva firma elegida al guardar', async () => {
    await scenario(async (page, state) => {
      await page.locator('input[type=file]').setInputFiles({ name: 'firma-nueva.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
      const preview = await page.getByAltText('Vista previa de la firma').getAttribute('src')
      await page.getByRole('button', { name: 'Agregar director de grado' }).click()
      await page.getByLabel('Docente director de grado').selectOption('20')
      assert.equal(await page.getByLabel('Grupo de investigación', { exact: true }).inputValue(), '5')
      const save = page.getByRole('button', { name: 'Guardar director de grado', exact: true })
      await save.click()
      assert.equal(await page.getByRole('button', { name: 'Guardando director…' }).isDisabled(), true)
      await page.getByRole('status').filter({ hasText: 'El director de grado se asignó correctamente.' }).waitFor()
      assert.equal(state.puts.length, 1)
      assert.deepEqual(state.puts[0], { grupoInvestigacionId: 5, directorId: 20 })
      assert.equal(await page.getByRole('button', { name: 'Agregar director de grado' }).count(), 0)
      assert.equal(await page.getByAltText('Vista previa de la firma').getAttribute('src'), preview)
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('SAPP_AUTH_SESSION')))
      assert.equal(saved.user.estudiante.directorTg.id, 20)
      assert.equal(saved.user.detalle.estudiante.directorTg.id, 20)
      await page.getByRole('button', { name: 'Guardar firma', exact: true }).click()
      await page.getByText('La firma se actualizó correctamente.').waitFor()
      assert.equal(state.signaturePosts.length, 1)
      assert.equal('titulo' in state.signaturePosts[0], false)
      await page.reload()
      await page.getByText('Ana Torres', { exact: true }).waitFor()
      assert.equal(await page.getByRole('button', { name: 'Agregar director de grado' }).count(), 0)
    })
  })

  await t.test('director con nombre y correo nulos permanece bloqueado', async () => {
    await scenario(async page => {
      await page.getByText('Director asignado; nombre no disponible').waitFor()
      assert.equal(await page.getByRole('button', { name: 'Agregar director de grado' }).count(), 0)
    }, { ...conDirector, director: { id: 20, nombreCompleto: null, correo: null } })
  })

  await t.test('cambiar grupo limpia docente y descarta respuesta antigua', async () => {
    await scenario(async (page, state) => {
      await page.getByRole('button', { name: 'Agregar director de grado' }).click()
      await page.getByLabel('Docente director de grado').selectOption('20')
      await page.getByLabel('Grupo de investigación', { exact: true }).selectOption('6')
      await page.getByText('Este grupo no tiene docentes de posgrado disponibles.').waitFor()
      assert.equal(await page.getByLabel('Docente director de grado').inputValue(), '')
      assert.equal(await page.getByRole('button', { name: 'Guardar director de grado', exact: true }).isDisabled(), true)
      state.slowGroup = true
      await page.getByLabel('Grupo de investigación', { exact: true }).selectOption('5')
      await page.getByLabel('Grupo de investigación', { exact: true }).selectOption('6')
      await page.getByText('Este grupo no tiene docentes de posgrado disponibles.').waitFor()
      await page.waitForTimeout(450)
      assert.equal(await page.getByLabel('Docente director de grado').locator('option').count(), 1)
    })
  })

  await t.test('errores de consulta bloquean formulario y permiten reintentar', async () => {
    await scenario(async (page, state) => {
      state.errorGet = true
      await page.reload()
      await page.getByText('Consulta no disponible').waitFor()
      assert.equal(await page.getByRole('button', { name: 'Agregar director de grado' }).count(), 0)
      state.errorGet = false
      await page.getByRole('button', { name: 'Reintentar consulta', exact: true }).click()
      state.errorGroups = true
      await page.getByRole('button', { name: 'Agregar director de grado' }).click()
      await page.getByText('Grupos no disponibles').waitFor()
      state.errorGroups = false
      await page.getByRole('button', { name: 'Reintentar consulta', exact: true }).click()
      await page.getByLabel('Docente director de grado').selectOption('20')
      assert.equal(await page.getByRole('button', { name: 'Guardar director de grado', exact: true }).isEnabled(), true)
    })
  })

  await t.test('fallo de guardado conserva selección y permite reintentar', async () => {
    await scenario(async (page, state) => {
      await page.getByRole('button', { name: 'Agregar director de grado' }).click()
      await page.getByLabel('Docente director de grado').selectOption('20')
      state.errorSave = true
      await page.getByRole('button', { name: 'Guardar director de grado', exact: true }).click()
      await page.getByText('No fue posible validar el docente; reintenta.').waitFor()
      assert.equal(await page.getByLabel('Docente director de grado').inputValue(), '20')
      state.errorSave = false
      await page.getByRole('button', { name: 'Guardar director de grado', exact: true }).click()
      await page.getByText('El director de grado se asignó correctamente.').waitFor()
      assert.equal(state.puts.length, 2)
    })
  })

  await t.test('409 vuelve a consultar y muestra asignación concurrente', async () => {
    await scenario(async (page, state) => {
      await page.getByRole('button', { name: 'Agregar director de grado' }).click()
      await page.getByLabel('Docente director de grado').selectOption('20')
      state.conflict = true
      await page.getByRole('button', { name: 'Guardar director de grado', exact: true }).click()
      await page.getByText('Ya tienes un director de grado asignado.').waitFor()
      await page.getByText('Ana Torres', { exact: true }).waitFor()
      assert.equal(await page.getByRole('button', { name: 'Agregar director de grado' }).count(), 0)
    })
  })

  await t.test('fallo de reconsulta tras 409 mantiene el formulario bloqueado', async () => {
    await scenario(async (page, state) => {
      await page.getByRole('button', { name: 'Agregar director de grado' }).click()
      await page.getByLabel('Docente director de grado').selectOption('20')
      state.conflict = true
      state.errorGet = true
      await page.getByRole('button', { name: 'Guardar director de grado', exact: true }).click()
      await page.getByText('Ya tienes un director de grado asignado.').waitFor()
      assert.equal(await page.getByRole('button', { name: 'Agregar director de grado' }).count(), 0)
      state.errorGet = false
      await page.getByRole('button', { name: 'Reintentar consulta', exact: true }).click()
      await page.getByText('Ana Torres', { exact: true }).waitFor()
    })
  })

  await t.test('formulario adaptable en claro y oscuro', async () => {
    await scenario(async page => {
      await page.getByRole('button', { name: 'Agregar director de grado' }).click()
      await page.getByLabel('Docente director de grado').selectOption('20')
      const artifacts = process.env.SAPP_TEST_ARTIFACTS || '.director-grado-artifacts.local'
      await mkdir(artifacts, { recursive: true })
      await page.locator('.profile-page__director').screenshot({ path: join(artifacts, 'director-claro.png') })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.locator('.sidebar').waitFor({ state: 'hidden' })
      await page.evaluate(() => {
        document.body.classList.remove('light')
        document.body.classList.add('dark')
        document.body.style.colorScheme = 'dark'
      })
      const bounds = await page.locator('.profile-page__director').boundingBox()
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391)
      assert.equal(await page.getByLabel('Docente director de grado').inputValue(), '20')
      await page.locator('.profile-page__director').screenshot({ path: join(artifacts, 'director-oscuro-movil.png') })
    })
  })
})
