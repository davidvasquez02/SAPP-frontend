import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { preview } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')

test('distribución del detalle de solicitudes en ambos temas', async t => {
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => new Promise(resolve => {
    server.httpServer.close(resolve)
    server.httpServer.closeAllConnections()
  }))
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())

  const familias = [
    ['general', 'OTRA', 11, 'Otra solicitud académica', 'Información de la solicitud'],
    ['proyecto', 'PROP_TESIS_DCC', 4, 'Propuesta de tesis de doctorado', 'Información del proyecto'],
    ['credito', 'RENOV_CRED_COND', 3, 'Renovación de crédito condonable', 'Información del crédito condonable'],
  ]
  for (const [familia, codigo, tipoId, nombre, tituloSeccion] of familias) {
    for (const estudiante of [true, false]) {
      await t.test(`${familia} · ${estudiante ? 'estudiante' : 'coordinación'}`, async () => {
        const page = await browser.newPage()
        try {
          const path = familia === 'proyecto' ? '/trabajos-grado/doctorado/solicitudes/42'
            : familia === 'credito' && !estudiante ? '/creditos-condonables/42' : '/solicitudes/42'
          const solicitud = {
            id: 42, estudianteId: 10, estudiante: 'Juan Carlos Vega Delgado', codigoEstudianteUis: '225840',
            programaAcademico: '347 - Doctorado en Ciencias de la Computación', tipoSolicitudId: tipoId,
            tipoSolicitudCodigo: codigo, tipoSolicitud: nombre, tipoTramiteCodigo: '1008',
            estadoId: 1, estadoSigla: 'EN_VALIDACION_COORDINACION', estado: 'En validación de coordinación',
            fechaRegistro: '2026-11-17', fechaResolucion: null, observaciones: 'Observaciones del trámite.',
            tituloTrabajo: familia === 'proyecto' ? 'Artículo de investigación doctoral' : null,
            resumenTrabajo: familia === 'proyecto' ? 'Resumen del proyecto con un identificador largo.\n' + 'A'.repeat(100) : null,
            motivosCreditoCondonable: ['Continuidad académica', 'Apoyo a la investigación'],
          }
          await page.route('**/*', route => {
            const req = route.request()
            const url = new URL(req.url())
            const reply = data => route.fulfill({ json: { ok: true, data } })
            if (url.pathname.endsWith('/inicio')) {
              const persona = { id: 100, firstName: 'Persona', lastName: 'Prueba', fullName: 'Persona Prueba', attributes: {} }
              return reply({ ...persona, username: 'prueba', roles: [],
                clientRoles: [estudiante ? 'ESTUDIANTE_POSGRADOS' : 'COORDINADOR_POSGRADOS'],
                detalle: { persona, estudiante: estudiante ? { id: 10, programaId: 1, codigoEstudianteUis: '225840' } : null } })
            }
            if (url.pathname.endsWith('/solicitudesAcademicas/estudiante')) return reply([solicitud])
            if (url.pathname.endsWith('/solicitudesAcademicas/42')) return reply(solicitud)
            if (url.pathname.includes('/procesoEvaluacionTg/solicitud/')) return reply(null)
            if (['fetch', 'xhr'].includes(req.resourceType())) return reply([])
            return url.origin === origin ? route.continue() : route.abort()
          })
          for (const theme of ['light', 'dark']) {
            await page.goto(origin + path)
            await page.evaluate(value => localStorage.setItem('sapp-theme', value), theme)
            for (const width of [1440, 390]) {
              await page.setViewportSize({ width, height: 960 })
              await page.goto(origin + path)
              const header = page.locator('.solicitud-detalle-page__header')
              const title = header.getByRole('heading', { name: nombre })
              await title.waitFor()
              await page.getByRole('region', { name: tituloSeccion }).waitFor()
              await page.getByText('0 documentos', { exact: true }).waitFor()
              assert.ok(await page.locator('body').evaluate((body, value) => body.classList.contains(value), theme))
              const badge = await header.locator('.status-badge').boundingBox()
              const titleBox = await title.boundingBox()
              if (width === 390) assert.ok(badge.y >= titleBox.y + titleBox.height)
              else assert.ok(badge.x >= titleBox.x + titleBox.width)
              const grid = page.getByLabel('Datos generales')
              assert.equal(await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), width === 390 ? 1 : 2)
              for (const block of [header, grid, page.getByRole('region', { name: tituloSeccion })]) {
                assert.ok(await block.evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth + 1))
              }
              if (process.env.SAPP_DETALLE_CAPTURAS && familia === 'proyecto' && !estudiante) {
                await page.setViewportSize({ width, height: 2400 })
                const top = await header.boundingBox()
                const bottom = await page.getByRole('heading', { name: 'Documentos adjuntos' }).boundingBox()
                await page.screenshot({ path: join(process.env.SAPP_DETALLE_CAPTURAS, `detalle-${width}-${theme}.png`),
                  clip: { x: top.x, y: top.y, width: top.width, height: bottom.y + bottom.height - top.y } })
              }
              if (familia === 'proyecto' && estudiante && width === 1440) {
                const enlace = page.locator('.sidebar').getByRole('link', { name: 'Proyectos de investigación', exact: true })
                if (theme === 'light') await enlace.hover()
                else await enlace.focus()
                const etiqueta = enlace.locator('.sidebar__label')
                await page.waitForFunction(el => {
                  const texto = document.createRange()
                  texto.selectNodeContents(el)
                  const caja = el.getBoundingClientRect()
                  return getComputedStyle(el).opacity === '1' && caja.width > 0 &&
                    [...texto.getClientRects()].every(linea => linea.right <= caja.right + 1 && linea.bottom <= caja.bottom + 1)
                }, await etiqueta.elementHandle())
                await page.mouse.move(width - 1, 0)
              }
            }
          }
        } finally {
          await page.close()
        }
      })
    }
  }
})
