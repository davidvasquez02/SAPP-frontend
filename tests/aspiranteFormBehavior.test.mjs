import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('admisiones React: validación de aspirante y carga documental', async t => {
  const ui = await reactApiHarness(t)
  const previousFrame = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame')
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: callback => { callback(); return 1 } })
  t.after(() => previousFrame ? Object.defineProperty(globalThis, 'requestAnimationFrame', previousFrame) : delete globalThis.requestAnimationFrame)
  window.HTMLElement.prototype.scrollIntoView = () => {}
  const { CreateAspiranteModal: Form } = await ui.load('/src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx')
  const session = await ui.load('/src/modules/auth/session/sessionStore.ts')
  let catalogFailure, docsFailure, createStatus, uploadFailure, creates, uploads, created, closed, hold, release
  const result = { id: 70, inscripcionAdmisionId: 160, nombre1: 'Ana', apellido1: 'Prueba' }
  t.beforeEach(() => {
    catalogFailure = false; docsFailure = false; createStatus = 200; uploadFailure = false; creates = []; uploads = []; created = []; closed = 0; hold = false; release = undefined
    ui.response(async (url, init) => {
      if (url.endsWith('/tipoDocumentoIdentificacion')) return catalogFailure ? Response.json({ message: 'Catálogo no disponible' }, { status: 503 }) : Response.json({ ok: true, data: [{ id: 1, codigoNombre: 'CC - Cédula' }] })
      if (url.includes('/tramite/document')) return docsFailure ? Response.json({ message: 'Requisitos no disponibles' }, { status: 503 }) : Response.json({ ok: true, data: [{ id: 5, codigo: 'ANX-1', nombre: 'Certificado', obligatorio: true, tipoTramite: 'ADMISION_COORDINACION' }] })
      if (url.endsWith('/aspirante')) {
        creates.push(JSON.parse(init.body))
        if (hold) await new Promise(resolve => { release = resolve })
        return createStatus === 200 ? Response.json({ ok: true, data: result }) : Response.json({ message: 'Creación no autorizada o no disponible' }, { status: createStatus })
      }
      if (url.endsWith('/document') && init.method === 'POST') {
        uploads.push(JSON.parse(init.body))
        return uploadFailure ? Response.json({ message: 'Carga no disponible' }, { status: 503 }) : Response.json({ ok: true, data: { id: 50, nombreArchivo: 'certificado.pdf' } })
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, props = {}) => {
    s.after(ui.cleanup)
    return ui.render(createElement(Form, { open: true, programaId: 1, convocatoriaAdmisionId: 107, onClose: () => { closed++ }, onCreated: data => created.push(data), ...props }))
  }
  const ready = async view => { await view.findByRole('option', { name: 'CC - Cédula' }); await view.findByText('Certificado') }
  const set = (view, label, value) => ui.fireEvent.change(view.getByLabelText(label), { target: { value } })
  const fill = async view => {
    await ready(view)
    set(view, /^Primer nombre/, ' Ana ')
    set(view, /^Primer apellido/, ' Prueba ')
    ui.fireEvent.change(view.getByRole('combobox'), { target: { value: '1' } })
    set(view, /^Número de documento/, ' 1000001 ')
    set(view, /^Email personal/, 'ana@example.test')
    set(view, /^Número de inscripción UIS/, ' 2026001 ')
  }
  const file = view => ui.fireEvent.change(view.getByLabelText('Seleccionar archivo'), { target: { files: [new File(['%PDF-'], 'certificado.pdf', { type: 'application/pdf' })] } })
  const submit = view => ui.fireEvent.submit(view.container.querySelector('form'))

  await t.test('cerrado no carga catálogos ni muestra formulario', s => {
    const count = ui.requests.length
    const view = mount(s, { open: false })
    assert.equal(view.queryAllByRole('dialog').length, 0)
    assert.equal(ui.requests.length, count)
  })

  await t.test('campos obligatorios y documento pendiente impiden crear', async s => {
    const view = mount(s)
    await ready(view)
    submit(view)
    for (const text of ['El primer nombre es obligatorio.', 'El primer apellido es obligatorio.', 'Seleccione un tipo de documento.', 'El número de documento es obligatorio.', 'El email es obligatorio.', 'El número de inscripción es obligatorio.', 'Adjunte todos los documentos requeridos.']) assert.ok(view.getByText(text))
    assert.equal(creates.length, 0)
  })

  await t.test('rechaza identificación e inscripción no numéricas y correo inválido', async s => {
    const view = mount(s)
    await fill(view)
    set(view, /^Número de documento/, 'ABC')
    set(view, /^Número de inscripción UIS/, 'NO-VALIDO')
    set(view, /^Email personal/, 'sin-dominio')
    file(view)
    submit(view)
    assert.equal(view.getAllByText('Solo se permiten dígitos.').length, 2)
    assert.ok(view.getByText('Ingrese un email válido.'))
    assert.equal(creates.length, 0)
  })

  await t.test('PNG no satisface requisito y PDF puede seleccionarse y retirarse', async s => {
    const view = mount(s)
    await fill(view)
    ui.fireEvent.change(view.getByLabelText('Seleccionar archivo'), { target: { files: [new File(['foto'], 'foto.png', { type: 'image/png' })] } })
    assert.ok(view.getByText('Solo se permiten archivos PDF.'))
    submit(view)
    assert.equal(creates.length, 0)
    file(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Quitar archivo' }))
    submit(view)
    assert.ok(view.getByText('Adjunte todos los documentos requeridos.'))
  })

  await t.test('catálogo y requisitos fallidos pueden consultarse nuevamente', async s => {
    catalogFailure = true; docsFailure = true
    const view = mount(s)
    await view.findByText('Catálogo no disponible')
    await view.findByText('Requisitos no disponibles')
    catalogFailure = false; docsFailure = false
    for (const button of view.getAllByRole('button', { name: 'Reintentar' })) ui.fireEvent.click(button)
    await ready(view)
    assert.equal(view.getByRole('button', { name: 'Crear aspirante y cargar documentos' }).disabled, false)
  })

  await t.test('crear envía datos normalizados y carga al trámite de inscripción correcto', async s => {
    const view = mount(s)
    await fill(view)
    file(view)
    submit(view)
    await ui.waitFor(() => assert.equal(created.length, 1))
    assert.deepEqual(creates, [{ nombre1: 'Ana', nombre2: null, apellido1: 'Prueba', apellido2: null, tipoDocumentoIdentificacionId: 1, numeroDocumento: '1000001', emailPersonal: 'ana@example.test', numeroInscripcionUis: '2026001', telefono: null, observaciones: null, programaId: 1, convocatoriaAdmisionId: 107 }])
    assert.equal(uploads[0].tramiteId, 160)
    assert.equal(uploads[0].aspiranteCargaId, 70)
    assert.equal(uploads[0].usuarioCargaId, null)
    assert.equal(uploads[0].contenidoBase64, 'JVBERi0=')
    assert.match(uploads[0].checksum, /^[a-f0-9]{64}$/)
    assert.equal(created[0].uploadSummary.status, 'success')
    assert.equal(closed, 1)
  })

  await t.test('401 conserva sesión, valores y formulario para corregir el error', async s => {
    createStatus = 401
    session.saveSession({ accessToken: 'sesion-sintetica' })
    const view = mount(s)
    await fill(view)
    file(view)
    submit(view)
    await view.findByText('Creación no autorizada o no disponible')
    assert.equal(session.getToken(), 'sesion-sintetica')
    assert.equal(view.getByLabelText(/^Primer nombre/).value, ' Ana ')
    assert.equal(created.length, 0)
    assert.equal(closed, 0)
    createStatus = 200
    submit(view)
    await ui.waitFor(() => assert.equal(created.length, 1))
    session.clearSession()
  })

  await t.test('carga fallida reporta resultado parcial sin ocultar aspirante creado', async s => {
    uploadFailure = true
    const view = mount(s)
    await fill(view)
    file(view)
    submit(view)
    await ui.waitFor(() => assert.equal(created.length, 1))
    assert.equal(creates.length, 1)
    assert.equal(created[0].created.id, 70)
    assert.equal(created[0].uploadSummary.status, 'partial')
    assert.equal(created[0].uploadSummary.failedItems[0].errorMessage, 'Carga no disponible')
  })

  await t.test('durante creación bloquea envío repetido y cierre con Escape', async s => {
    hold = true
    const view = mount(s)
    await fill(view)
    file(view)
    submit(view)
    await ui.waitFor(() => assert.equal(creates.length, 1))
    assert.equal(view.getByRole('button', { name: 'Creando…' }).disabled, true)
    assert.equal(view.getByRole('button', { name: 'Cancelar' }).disabled, true)
    ui.fireEvent.keyDown(window, { key: 'Escape' })
    assert.equal(closed, 0)
    release()
    await ui.waitFor(() => assert.equal(created.length, 1))
    assert.equal(creates.length, 1)
  })
})
