import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('admisiones React: validación y creación de aspirante (sin documentos)', async t => {
  const ui = await reactApiHarness(t)
  const previousFrame = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame')
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: callback => { callback(); return 1 } })
  t.after(() => previousFrame ? Object.defineProperty(globalThis, 'requestAnimationFrame', previousFrame) : delete globalThis.requestAnimationFrame)
  window.HTMLElement.prototype.scrollIntoView = () => {}
  const { CreateAspiranteModal: Form } = await ui.load('/src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx')
  const session = await ui.load('/src/modules/auth/session/sessionStore.ts')
  let catalogFailure, createStatus, creates, documentRequests, created, closed, hold, release
  const result = { id: 70, inscripcionAdmisionId: 160, nombre1: 'Ana', apellido1: 'Prueba' }
  t.beforeEach(() => {
    catalogFailure = false; createStatus = 200; creates = []; documentRequests = []; created = []; closed = 0; hold = false; release = undefined
    ui.response(async (url, init) => {
      if (url.endsWith('/tipoDocumentoIdentificacion')) return catalogFailure ? Response.json({ message: 'Catálogo no disponible' }, { status: 503 }) : Response.json({ ok: true, data: [{ id: 1, codigoNombre: 'CC - Cédula' }] })
      if (url.endsWith('/aspirante')) {
        creates.push(JSON.parse(init.body))
        if (hold) await new Promise(resolve => { release = resolve })
        return createStatus === 200 ? Response.json({ ok: true, data: result }) : Response.json({ message: 'Creación no autorizada o no disponible' }, { status: createStatus })
      }
      // Crear un aspirante ya no pide ni sube documentos: cualquier llamada a documentos es un error.
      if (url.includes('/tramite/document') || url.endsWith('/document')) { documentRequests.push(url); return Response.json({ ok: true, data: [] }) }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, props = {}) => {
    s.after(ui.cleanup)
    return ui.render(createElement(Form, { open: true, programaId: 1, convocatoriaAdmisionId: 107, onClose: () => { closed++ }, onCreated: data => created.push(data), ...props }))
  }
  const ready = async view => { await view.findByRole('option', { name: 'CC - Cédula' }) }
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
  const submit = view => ui.fireEvent.submit(view.container.querySelector('form'))

  await t.test('cerrado no carga catálogos ni muestra formulario', s => {
    const count = ui.requests.length
    const view = mount(s, { open: false })
    assert.equal(view.queryAllByRole('dialog').length, 0)
    assert.equal(ui.requests.length, count)
  })

  await t.test('campos obligatorios impiden crear', async s => {
    const view = mount(s)
    await ready(view)
    submit(view)
    for (const text of ['El primer nombre es obligatorio.', 'El primer apellido es obligatorio.', 'Seleccione un tipo de documento.', 'El número de documento es obligatorio.', 'El email es obligatorio.', 'El número de inscripción es obligatorio.']) assert.ok(view.getByText(text))
    assert.equal(creates.length, 0)
  })

  await t.test('rechaza identificación e inscripción no numéricas y correo inválido', async s => {
    const view = mount(s)
    await fill(view)
    set(view, /^Número de documento/, 'ABC')
    set(view, /^Número de inscripción UIS/, 'NO-VALIDO')
    set(view, /^Email personal/, 'sin-dominio')
    submit(view)
    assert.equal(view.getAllByText('Solo se permiten dígitos.').length, 2)
    assert.ok(view.getByText('Ingrese un email válido.'))
    assert.equal(creates.length, 0)
  })

  await t.test('el formulario no muestra ni pide documentos', async s => {
    const view = mount(s)
    await ready(view)
    assert.equal(view.queryByText('Documentos'), null)
    assert.equal(view.queryByLabelText('Seleccionar archivo'), null)
    assert.equal(documentRequests.length, 0)
  })

  await t.test('catálogo fallido puede consultarse nuevamente', async s => {
    catalogFailure = true
    const view = mount(s)
    await view.findByText('Catálogo no disponible')
    catalogFailure = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Reintentar' }))
    await ready(view)
    assert.equal(view.getByRole('button', { name: 'Crear aspirante' }).disabled, false)
  })

  await t.test('crear envía datos normalizados y no sube documentos', async s => {
    const view = mount(s)
    await fill(view)
    submit(view)
    await ui.waitFor(() => assert.equal(created.length, 1))
    assert.deepEqual(creates, [{ nombre1: 'Ana', nombre2: null, apellido1: 'Prueba', apellido2: null, tipoDocumentoIdentificacionId: 1, numeroDocumento: '1000001', emailPersonal: 'ana@example.test', numeroInscripcionUis: '2026001', telefono: null, observaciones: null, programaId: 1, convocatoriaAdmisionId: 107 }])
    assert.equal(created[0].id, 70)
    assert.equal(documentRequests.length, 0)
    assert.equal(closed, 1)
  })

  await t.test('401 conserva sesión, valores y formulario para corregir el error', async s => {
    createStatus = 401
    session.saveSession({ accessToken: 'sesion-sintetica' })
    const view = mount(s)
    await fill(view)
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

  await t.test('durante creación bloquea envío repetido y cierre con Escape', async s => {
    hold = true
    const view = mount(s)
    await fill(view)
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

test('admisiones React: cargue de aspirantes desde Excel, uno a uno y sin detenerse por un error', async t => {
  const ui = await reactApiHarness(t)
  window.HTMLElement.prototype.scrollIntoView = () => {}
  const { CargarAspirantesExcelModal: Modal } = await ui.load('/src/modules/admisiones/components/CargarAspirantesExcelModal/CargarAspirantesExcelModal.tsx')

  const fila = (n, codigo, errores = []) => ({
    fila: n + 1, nombreOriginal: `APELLIDO${n} NOMBRE${n}`, nombre1: `Nombre${n}`, nombre2: null, apellido1: `Apellido${n}`, apellido2: null,
    tipoDocumentoIdentificacionId: 1, tipoDocumentoNombre: 'Cédula', numeroDocumento: `100${n}`, emailPersonal: `a${n}@b.co`, telefono: null,
    numeroInscripcionUis: codigo, programaId: 2, errores, valida: errores.length === 0,
  })
  let creates, finished, readBodies
  t.beforeEach(() => {
    creates = []; finished = []; readBodies = []
    ui.response(async (url, init) => {
      if (url.endsWith('/aspirante/importar-excel')) {
        readBodies.push(JSON.parse(init.body))
        return Response.json({ ok: true, data: { programaConvocatoria: 'Maestria en Ingenieria de Sistemas', filas: [fila(1, '11'), fila(2, '22', ['Correo inválido: \'x@y\'']), fila(3, '33'), fila(4, '44')] } })
      }
      if (url.endsWith('/aspirante')) {
        const body = JSON.parse(init.body)
        creates.push(body)
        // El aspirante con código 33 ya existe: debe quedar con ✗ sin detener al siguiente.
        if (body.numeroInscripcionUis === '33') return Response.json({ message: 'Ya existe un aspirante con el numero de inscripcion uis ingresado' }, { status: 404 })
        return Response.json({ ok: true, data: { id: Number(body.numeroInscripcionUis), inscripcionAdmisionId: 1 } })
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, props = {}) => {
    s.after(ui.cleanup)
    const file = new File(['excel'], 'ESTUDIANTES_2026-1.xls', { type: 'application/vnd.ms-excel' })
    return ui.render(createElement(Modal, { file, convocatoriaAdmisionId: 107, cuposDisponibles: null, onClose: () => {}, onFinished: r => finished.push(r), ...props }))
  }

  await t.test('sin archivo no muestra nada ni consulta', s => {
    const count = ui.requests.length
    const view = mount(s, { file: null })
    assert.equal(view.queryAllByRole('dialog').length, 0)
    assert.equal(ui.requests.length, count)
  })

  await t.test('crea los válidos, marca los fallidos con su razón y resume al final', async s => {
    const view = mount(s)
    await view.findByRole('button', { name: 'Cerrar' })
    assert.equal(readBodies[0].convocatoriaAdmisionId, 107)
    assert.equal(readBodies[0].nombreArchivo, 'ESTUDIANTES_2026-1.xls')
    // La fila con error del Excel no se envía; la que falla en el backend sí se intentó y no detuvo a la siguiente.
    assert.deepEqual(creates.map(c => c.numeroInscripcionUis), ['11', '33', '44'])
    assert.deepEqual(finished, [{ creados: 2, fallidos: 2 }])
    // El resumen y los fallidos con su razon quedan en la misma pantalla, sin un modal encima.
    assert.ok(view.getByText('✓ 2')); assert.ok(view.getByText('✗ 2'))
    assert.equal(view.queryAllByRole('alertdialog').length, 0)
    assert.ok(view.getAllByText(/Correo inválido/).length >= 1)
    assert.ok(view.getAllByText(/Ya existe un aspirante/).length >= 1)
  })

  await t.test('lo que excede los cupos disponibles falla sin llamar al backend', async s => {
    const view = mount(s, { cuposDisponibles: 1 })
    await view.findByRole('button', { name: 'Cerrar' })
    assert.ok(view.getByText('✓ 1'))
    assert.deepEqual(creates.map(c => c.numeroInscripcionUis), ['11'])
    assert.ok(view.getAllByText(/cupo máximo/).length >= 1)
  })

  await t.test('un archivo ilegible muestra el error y no crea nada', async s => {
    ui.response(async url => {
      if (url.endsWith('/aspirante/importar-excel')) return Response.json({ message: 'Al Excel le faltan las columnas: EMAIL' }, { status: 400 })
      throw new Error(`Petición inesperada: ${url}`)
    })
    const view = mount(s)
    await view.findByText('Al Excel le faltan las columnas: EMAIL')
    assert.equal(creates.length, 0)
    assert.equal(finished.length, 0)
  })
})
