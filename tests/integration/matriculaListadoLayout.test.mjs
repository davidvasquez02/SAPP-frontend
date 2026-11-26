import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { preview } from 'vite'

const { chromium } = createRequire(import.meta.url)(process.env.SAPP_PLAYWRIGHT_MODULE || 'playwright')

test('el listado mantiene estados uniformes en tabla y tarjetas', async t => {
  const estados = [
    { estado: 'FINALIZADA', etiqueta: 'Finalizada' },
    { estado: 'RADICADA', etiqueta: 'Radicada' },
    { estado: 'PENDIENTE_DOCUMENTOS', documentosCompletos: true, etiqueta: 'Pendiente de validación' },
    { estado: 'PENDIENTE_DOCUMENTOS', documentosCompletos: false, etiqueta: 'Pendiente de documentos' },
    { estado: 'INCLUSION_POR_VALIDAR', etiqueta: 'Inclusión por validar' },
  ]
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  t.after(() => {
    server.httpServer.close()
    server.httpServer.closeAllConnections()
  })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ channel: process.env.SAPP_BROWSER_CHANNEL || 'msedge' })
  t.after(() => browser.close())
  const page = await browser.newPage({ viewport: { width: 1407, height: 850 } })
  await page.route('**/*', route => {
    const request = route.request()
    const url = new URL(request.url())
    const reply = data => route.fulfill({ json: { ok: true, data } })
    if (url.pathname.endsWith('/inicio')) return reply({
      id: 100, username: 'prueba', fullName: 'Persona Prueba', roles: [], clientRoles: ['COORDINADOR_POSGRADOS'],
      detalle: { persona: { id: 100, fullName: 'Persona Prueba', attributes: {} } },
    })
    if (url.pathname.endsWith('/matriculaAcademica')) return reply(estados.map(({ estado, documentosCompletos }, index) => ({
      id: 24 + index, estudianteNombreCompleto: `Persona de Prueba ${index + 1}`, codigoEstudianteUis: `COD-${24 + index}`,
      programaAcademico: '302 - MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA',
      periodoAcademico: index === 0 ? '2027 - 1' : '2027 - 2', estado, documentosCompletos, fechaSolicitud: '2026-11-23T14:27:00',
    })))
    if (['fetch', 'xhr'].includes(request.resourceType())) return reply([])
    return url.origin === origin ? route.continue() : route.abort()
  })

  await page.goto(`${origin}/matricula/academica`)
  const tabla = page.getByRole('grid')
  await tabla.waitFor()
  const accion = tabla.getByRole('row').filter({ hasText: 'COD-24' }).getByRole('link', { name: 'Ver detalle' })
  assert.equal(await accion.getAttribute('href'), '/matricula/academica/24')
  for (const elemento of [accion, tabla.getByText('2027 - 1', { exact: true })]) {
    const lineas = await elemento.evaluate(nodo => {
      const rango = document.createRange()
      rango.selectNodeContents(nodo)
      return rango.getClientRects().length
    })
    assert.equal(lineas, 1)
  }
  const buscador = page.getByRole('searchbox', { name: 'Buscar estudiante' })
  const programa = page.getByRole('combobox', { name: 'Programa académico' })
  assert.equal((await buscador.boundingBox()).y, (await programa.boundingBox()).y)
  assert.equal(await page.getByRole('button', { name: 'Siguiente' }).count(), 0)

  const comprobarEstados = async contenedor => {
    const medidas = []
    for (const { etiqueta } of estados) {
      const estado = contenedor.getByText(etiqueta, { exact: true })
      assert.ok(await estado.isVisible(), etiqueta)
      medidas.push(await estado.evaluate(nodo => {
        const rango = document.createRange()
        rango.selectNodeContents(nodo)
        const { width, height } = nodo.getBoundingClientRect()
        const estilos = getComputedStyle(nodo)
        return { width, height, lineas: rango.getClientRects().length, fondo: estilos.backgroundColor, texto: estilos.color }
      }))
    }
    assert.ok(medidas.every(({ width, height, lineas }) =>
      width === medidas[0].width && height === medidas[0].height && lineas === 1))
    assert.notEqual(medidas[0].fondo, medidas[1].fondo)
    return medidas[0]
  }
  const estadoClaro = await comprobarEstados(tabla)

  await page.setViewportSize({ width: 375, height: 850 })
  await page.evaluate(() => {
    document.body.classList.remove('light')
    document.body.classList.add('dark')
  })
  assert.equal(await tabla.isVisible(), false)
  const tarjetas = page.getByRole('article')
  const estadoOscuro = await comprobarEstados(page.getByLabel('Matrículas académicas', { exact: true }))
  assert.notEqual(estadoOscuro.fondo, estadoClaro.fondo)
  assert.notEqual(estadoOscuro.texto, estadoClaro.texto)
  const tarjeta = tarjetas.filter({ hasText: 'COD-24' })
  assert.ok(await tarjeta.isVisible())
  const botonMovil = await tarjeta.getByRole('link', { name: 'Ver detalle' }).boundingBox()
  assert.ok(botonMovil.height >= 44 && botonMovil.x + botonMovil.width <= 375)
  await buscador.fill('Código inexistente')
  const vacio = page.getByText('No hay matrículas que coincidan con los filtros seleccionados.')
  await vacio.waitFor()
  assert.equal(await tarjeta.count(), 0)
})
