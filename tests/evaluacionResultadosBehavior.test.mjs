import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('resultados React: calificaciones, actas, cierre y rúbricas', async t => {
  const ui = await reactApiHarness(t)
  const { default: Panel } = await ui.load('/src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx')
  const jurado = (id, nota, activo = true) => ({ id, nombre: `Jurado ${id}`, correo: `jurado${id}@example.test`, institucion: 'UIS', activo, estadoInvitacion: 'ACEPTADA', evaluaciones: [{ id: id * 10, momentoCodigo: 'SUSTENTACION', momentoNombre: 'Sustentación', nota, resultadoNombre: 'Aprobado', observaciones: 'Concepto registrado' }] })
  let proceso, mutations, refreshed, failure, rubricFailure, hold, release, rubricCalls, downloads, blobs, revoked
  const ok = data => Response.json({ ok: true, data })
  t.beforeEach(s => {
    proceso = { id: 9, solicitudAcademicaId: 42, tipoSolicitudCodigo: 'CAND_DOCTORAL', titulo: 'Examen doctoral de prueba', estadoSolicitud: 'SUST_PROGRAMADA', jurados: [jurado(1, 4), jurado(2, 5), jurado(3, 1, false)] }
    mutations = []; refreshed = 0; failure = false; rubricFailure = false; hold = false; release = undefined; rubricCalls = 0; downloads = []; blobs = []; revoked = []
    s.mock.method(URL, 'createObjectURL', blob => { blobs.push(blob); return `blob:rubrica-${blobs.length}` })
    s.mock.method(URL, 'revokeObjectURL', url => revoked.push(url))
    window.HTMLAnchorElement.prototype.click = function () { downloads.push({ name: this.download, href: this.href }) }
    const nativeTimeout = window.setTimeout.bind(window)
    s.mock.method(window, 'setTimeout', (callback, delay, ...args) => delay === 0 ? (callback(...args), 1) : nativeTimeout(callback, delay, ...args))
    ui.response(async (url, init) => {
      const path = new URL(url, 'https://example.test').pathname
      if (path.endsWith('/catalogos')) return ok({ modalidades: [], resultados: [{ codigo: 'APROBADO', nombre: 'Aprobado' }, { codigo: 'REPROBADO', nombre: 'Reprobado' }], conceptos: [], momentos: [], estadosInvitacion: [] })
      if (path.endsWith('/solicitud/42')) return ok(proceso)
      if (path.endsWith('/resultado')) {
        if (hold) await new Promise(resolve => { release = resolve })
        if (failure) return Response.json({ message: 'Resultado no registrado' }, { status: 409 })
        const body = JSON.parse(init.body)
        mutations.push(body)
        proceso = { ...proceso, estadoSolicitud: 'FINALIZADA', notaFinal: body.notaFinal }
        return ok(proceso)
      }
      if (path.endsWith('/rubrica')) {
        rubricCalls++
        if (hold) await new Promise(resolve => { release = resolve })
        if (rubricFailure) return Response.json({ message: 'Rúbrica no disponible' }, { status: 503 })
        assert.ok(path.endsWith('/evaluaciones/10/rubrica'))
        return ok({ contenidoBase64: 'JVBERi0=', mimeType: 'application/pdf', nombreArchivo: 'rubrica-sustentacion.pdf' })
      }
      throw new Error(`Petición inesperada: ${path}`)
    })
  })
  const mount = s => {
    s.after(ui.cleanup)
    return ui.render(createElement(Panel, { solicitudId: 42, documentos: [], actas: [{ id: 8, codigo: 'ACT-8', nombre: 'Acta de evaluación' }], onUpdated: async () => { refreshed++ }, onJuradoAdded: async () => {} }))
  }
  const ready = async view => { await view.findByRole('heading', { name: 'Proceso de evaluación' }) }
  const open = view => ui.fireEvent.click(view.getByRole('button', { name: 'Registrar resultado' }))

  await t.test('conceptos recibidos usa la etiqueta de estado compartida', async s => {
    proceso.estadoSolicitud = 'CONCEPTOS_REC'
    const view = mount(s)
    const badge = await view.findByText('CONCEPTOS RECIBIDOS', { exact: true })
    assert.ok(badge.classList.contains('status-badge--en-revision'))
  })
  const save = view => ui.fireEvent.click(view.getAllByRole('button', { name: 'Registrar resultado' }).at(-1))

  await t.test('jurado activo sin sustentación bloquea registro del resultado', async s => {
    proceso.jurados[1].evaluaciones = []
    const view = mount(s)
    await ready(view)
    assert.equal(view.queryAllByRole('button', { name: 'Registrar resultado' }).length, 0)
    assert.equal(mutations.length, 0)
  })

  await t.test('promedio usa solo notas de jurados activos y permite modificarlo', async s => {
    const view = mount(s)
    await ready(view)
    open(view)
    assert.equal(view.getByLabelText(/Nota final/).value, '4.50')
    ui.fireEvent.change(view.getByLabelText(/Nota final/), { target: { value: '4.3' } })
    ui.fireEvent.change(view.getByLabelText('Acta'), { target: { value: '8' } })
    save(view)
    await view.findByText('Resultado registrado y proceso cerrado.')
    assert.deepEqual(mutations, [{ resultadoCodigo: '', notaFinal: 4.3, actaId: 8 }])
    assert.equal(refreshed, 1)
    assert.ok(ui.within(view.getByLabelText('Calificación definitiva')).getByText('4,30'))
    assert.equal(view.queryAllByRole('button', { name: 'Registrar resultado' }).length, 0)
    assert.equal(view.queryByRole('heading', { name: 'Histórico de cambios' }), null)
  })

  await t.test('nota vacía o fuera de 0–5 deshabilita envío', async s => {
    const view = mount(s)
    await ready(view)
    open(view)
    for (const value of ['', '-0.01', '5.01']) {
      ui.fireEvent.change(view.getByLabelText(/Nota final/), { target: { value } })
      const button = view.getAllByRole('button', { name: 'Registrar resultado' }).at(-1)
      assert.equal(button.disabled, true)
      ui.fireEvent.click(button)
    }
    assert.equal(mutations.length, 0)
  })

  for (const nota of [0, 5]) await t.test(`nota límite ${nota} es válida sin acta asociada`, async s => {
    const view = mount(s)
    await ready(view)
    open(view)
    ui.fireEvent.change(view.getByLabelText(/Nota final/), { target: { value: String(nota) } })
    save(view)
    await view.findByText('Resultado registrado y proceso cerrado.')
    assert.deepEqual(mutations, [{ resultadoCodigo: '', notaFinal: nota, actaId: null }])
  })

  await t.test('defensa de tesis envía resultado del catálogo en vez de nota doctoral', async s => {
    proceso.tipoSolicitudCodigo = 'DEF_TESIS_DCC'
    const view = mount(s)
    await ready(view)
    open(view)
    assert.equal(view.queryAllByLabelText(/Nota final/).length, 0)
    ui.fireEvent.change(view.getByLabelText(/^Resultado/), { target: { value: 'REPROBADO' } })
    save(view)
    await view.findByText('Resultado registrado y proceso cerrado.')
    assert.deepEqual(mutations, [{ resultadoCodigo: 'REPROBADO', notaFinal: null, actaId: null }])
    assert.equal(view.queryAllByLabelText('Calificación definitiva').length, 0)
  })

  await t.test('cancelar no registra nota ni cierra el proceso', async s => {
    const view = mount(s)
    await ready(view)
    open(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cancelar' }))
    assert.equal(view.queryAllByLabelText(/Nota final/).length, 0)
    assert.equal(mutations.length, 0)
    assert.equal(proceso.estadoSolicitud, 'SUST_PROGRAMADA')
  })

  await t.test('rechazo del servidor conserva nota y acta para reintentar', async s => {
    failure = true
    const view = mount(s)
    await ready(view)
    open(view)
    ui.fireEvent.change(view.getByLabelText(/Nota final/), { target: { value: '4.1' } })
    ui.fireEvent.change(view.getByLabelText('Acta'), { target: { value: '8' } })
    save(view)
    await view.findByText('Resultado no registrado')
    assert.equal(view.getByLabelText(/Nota final/).value, '4.1')
    assert.equal(view.getByLabelText('Acta').value, '8')
    assert.equal(refreshed, 0)
    failure = false
    save(view)
    await view.findByText('Resultado registrado y proceso cerrado.')
    assert.equal(mutations.length, 1)
  })

  await t.test('registro pendiente bloquea segundo envío desde el botón', async s => {
    hold = true
    const view = mount(s)
    await ready(view)
    open(view)
    save(view)
    await ui.waitFor(() => assert.equal(typeof release, 'function'))
    const button = view.getAllByRole('button', { name: 'Registrar resultado' }).at(-1)
    assert.equal(button.disabled, true)
    ui.fireEvent.click(button)
    release()
    await view.findByText('Resultado registrado y proceso cerrado.')
    assert.equal(mutations.length, 1)
  })

  await t.test('sin archivo de rúbrica no muestra descarga', async s => {
    const view = mount(s)
    await ready(view)
    assert.equal(view.queryAllByRole('button', { name: /Descargar rúbrica/ }).length, 0)
    assert.equal(rubricCalls, 0)
  })

  await t.test('rúbrica descarga bytes, nombre y MIME reales y libera URL temporal', async s => {
    proceso.jurados[0].evaluaciones[0].rubricaNombreArchivo = 'rubrica.pdf'
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Descargar rúbrica de Sustentación' }))
    await ui.waitFor(() => assert.equal(downloads.length, 1))
    assert.deepEqual(downloads, [{ name: 'rubrica-sustentacion.pdf', href: 'blob:rubrica-1' }])
    assert.equal(blobs[0].type, 'application/pdf')
    assert.equal(await blobs[0].text(), '%PDF-')
    assert.deepEqual(revoked, ['blob:rubrica-1'])
  })

  await t.test('fallo de descarga no crea archivo y permite reintentar', async s => {
    proceso.jurados[0].evaluaciones[0].rubricaNombreArchivo = 'rubrica.pdf'
    rubricFailure = true
    const view = mount(s)
    await ready(view)
    const button = view.getByRole('button', { name: 'Descargar rúbrica de Sustentación' })
    ui.fireEvent.click(button)
    await ui.waitFor(() => assert.equal(rubricCalls, 1))
    await ui.waitFor(() => assert.equal(button.disabled, false))
    assert.equal(downloads.length, 0)
    rubricFailure = false
    ui.fireEvent.click(button)
    await ui.waitFor(() => assert.equal(downloads.length, 1))
    assert.equal(rubricCalls, 2)
  })
})
