import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

// Ejecutar npm run build primero. Sesiones y respuestas sintéticas; no se envían correos reales.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')
const routePath = '/trabajos-grado/maestria/solicitudes/42'
const modalidades = [
  { codigo: 'PRESENCIAL', nombre: 'Presencial' },
  { codigo: 'VIRTUAL', nombre: 'Virtual' },
  { codigo: 'HIBRIDA', nombre: 'Híbrida' },
]

test('sustentación: modalidad híbrida y regresión de modalidades existentes', { timeout: 120000 }, async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => new Promise((resolve, reject) => {
    server.httpServer.close(error => error ? reject(error) : resolve())
    server.httpServer.closeAllConnections()
  }))
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ headless: true, channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())

  const scenario = async (run, { student = false, mobile = false } = {}) => {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 } })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const state = {
      requests: [],
      proceso: { id: 9, solicitudAcademicaId: 42, tipoSolicitudCodigo: 'DEF_TI_MISI', titulo: 'Trabajo de prueba', programa: 'Maestría', estadoSolicitud: student ? 'SUST_PROGRAMADA' : 'CONCEPTOS_REC', jurados: [],
        ...(student ? { modalidadSustentacionCodigo: 'HIBRIDA', modalidadSustentacion: 'Híbrida', fechaSustentacion: '2026-12-01T10:00:00', lugarSustentacion: 'UIS, sala 4', enlaceSustentacion: 'https://meet.example/sala' } : {}) },
    }
    const solicitud = () => ({ id: 42, estudianteId: 10, estudiante: 'Estudiante de prueba', codigoEstudianteUis: '20260001', programaAcademico: 'Maestría', tipoSolicitudId: 7, tipoSolicitudCodigo: 'DEF_TI_MISI', tipoSolicitud: 'Defensa del trabajo de investigación', tipoTramiteCodigo: '2000', estadoId: 15, estadoSigla: state.proceso.estadoSolicitud, estado: state.proceso.estadoSolicitud, fechaRegistro: '2026-10-15', fechaResolucion: null, observaciones: null })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      const reply = data => route.fulfill({ json: { ok: true, data, message: 'Consulta exitosa' } })
      if (url.pathname.endsWith('/inicio')) return reply({
        id: 100, uuid: '11111111-1111-1111-1111-111111111111', username: 'prueba', firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {}, roles: [], clientRoles: [student ? 'ESTUDIANTE_POSGRADOS' : 'COORDINADOR_POSGRADOS'],
        detalle: { aspirante: null, docente: null, estudiante: student ? { id: 10, programaId: 1, codigoEstudianteUis: '20260001' } : null, persona: { id: 100, firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', email: 'persona@example.test', attributes: {} } },
      })
      if (url.pathname.endsWith('/firmaUsuario/100')) return reply({ titulo: '', contenidoFirma: 'data:image/png;base64,QQ==' })
      if (url.pathname.endsWith('/solicitudesAcademicas/42')) return reply(solicitud())
      if (url.pathname.endsWith('/solicitudesAcademicas/estudiante')) {
        assert.equal(url.searchParams.get('estudianteId'), '10')
        return reply([solicitud()])
      }
      if (url.pathname.endsWith('/procesoEvaluacionTg/catalogos')) return reply({ modalidades, estadosInvitacion: [], momentos: [], conceptos: [], resultados: [{ codigo: 'APROBADO', nombre: 'Aprobado' }] })
      if (url.pathname.endsWith('/procesoEvaluacionTg/solicitud/42/sustentacion')) {
        const payload = request.postDataJSON()
        state.requests.push(payload)
        state.proceso = { ...state.proceso, estadoSolicitud: 'SUST_PROGRAMADA', fechaSustentacion: payload.fechaSustentacion,
          modalidadSustentacionCodigo: payload.modalidadCodigo, modalidadSustentacion: modalidades.find(m => m.codigo === payload.modalidadCodigo).nombre,
          lugarSustentacion: payload.lugar, enlaceSustentacion: payload.enlace }
        return reply(state.proceso)
      }
      if (url.pathname.endsWith('/procesoEvaluacionTg/solicitud/42')) return reply(state.proceso)
      if (['fetch', 'xhr'].includes(request.resourceType())) return reply([])
      if (url.origin !== origin) return route.abort()
      return route.continue()
    })
    try {
      if (mobile) await page.addInitScript(() => localStorage.setItem('sapp-theme', 'dark'))
      await page.goto(`${origin}${routePath}`)
      await run(page, state)
      assert.deepEqual(errors, [])
    } catch (error) {
      console.error('Detalle sintético:', await page.locator('body').innerText().catch(() => ''), errors)
      throw error
    } finally { await context.close() }
  }

  const abrirHibrida = async page => {
    await page.getByRole('button', { name: 'Programar sustentación', exact: true }).click()
    const form = page.locator('.evaluacion-tg__form-card')
    await form.getByRole('combobox').selectOption('HIBRIDA')
    await form.locator('input[type=datetime-local]').fill('2026-12-01T10:00')
    return form
  }

  await t.test('exige lugar y URL y muestra ambos tras programar', async () => {
    await scenario(async (page, state) => {
      const form = await abrirHibrida(page)
      await form.getByRole('button', { name: 'Programar', exact: true }).click()
      await page.getByText('La modalidad seleccionada requiere un lugar.').waitFor()
      await form.getByLabel('Lugar *', { exact: true }).fill(' UIS, sala 4 ')
      await form.getByRole('button', { name: 'Programar', exact: true }).click()
      await page.getByText('La modalidad seleccionada requiere un enlace.').waitFor()
      await form.getByLabel('Enlace *', { exact: true }).fill('javascript:alert(1)')
      await form.getByRole('button', { name: 'Programar', exact: true }).click()
      await page.getByText('Ingresa un enlace de videoconferencia válido (http o https).').waitFor()
      assert.equal(state.requests.length, 0)
      await form.getByLabel('Enlace *', { exact: true }).fill(' https://meet.example/sala ')
      await form.getByRole('button', { name: 'Programar', exact: true }).click()
      await page.getByRole('heading', { name: 'Información de la sustentación' }).waitFor()
      const detalle = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Información de la sustentación', exact: true }) }).last()
      await detalle.getByText('UIS, sala 4', { exact: true }).waitFor()
      assert.equal(await detalle.getByRole('link', { name: 'Ingresar a la sustentación' }).getAttribute('href'), 'https://meet.example/sala')
      assert.deepEqual(state.requests, [{ fechaSustentacion: '2026-12-01T10:00', modalidadCodigo: 'HIBRIDA', lugar: 'UIS, sala 4', enlace: 'https://meet.example/sala', notificarJurados: true }])
    })
  })

  await t.test('cambiar a presencial o virtual oculta y omite el campo que no aplica', async () => {
    for (const modo of ['PRESENCIAL', 'VIRTUAL']) await scenario(async (page, state) => {
      const form = await abrirHibrida(page)
      await form.getByLabel('Lugar *', { exact: true }).fill('UIS')
      await form.getByLabel('Enlace *', { exact: true }).fill('https://meet.example/sala')
      await form.getByRole('combobox').selectOption(modo)
      assert.equal(await form.getByLabel(modo === 'PRESENCIAL' ? 'Enlace *' : 'Lugar *', { exact: true }).count(), 0)
      await form.getByRole('button', { name: 'Programar', exact: true }).click()
      await page.getByRole('heading', { name: 'Información de la sustentación' }).waitFor()
      assert.equal(state.requests[0].modalidadCodigo, modo)
      assert.equal(state.requests[0][modo === 'PRESENCIAL' ? 'enlace' : 'lugar'], null)
    })
  })

  await t.test('el estudiante ve lugar y enlace de la sustentación híbrida', async () => {
    await scenario(async page => {
      const detalle = page.getByRole('definition').filter({ hasText: 'UIS, sala 4' })
      await page.getByRole('link', { name: 'Ingresar a la sustentación' }).waitFor()
      assert.equal(await detalle.count(), 1)
      assert.equal(await page.getByRole('button', { name: 'Programar sustentación', exact: true }).count(), 0)
    }, { student: true })
  })

  await t.test('ambos campos se pueden usar en móvil y modo oscuro', async () => {
    await scenario(async page => {
      const form = await abrirHibrida(page)
      await form.getByLabel('Lugar *', { exact: true }).fill('UIS')
      await form.getByLabel('Enlace *', { exact: true }).fill('https://meet.example/sala')
      const bounds = await form.boundingBox()
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391)
      assert.equal(await page.locator('body.dark').count(), 1)
    }, { mobile: true })
  })
})
