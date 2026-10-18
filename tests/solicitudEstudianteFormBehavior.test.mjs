import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('formulario de solicitudes React: validación, documentos y homologación', async t => {
  const ui = await reactApiHarness(t)
  const { default: Form } = await ui.load('/src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx')
  const tipos = [
    { id: 99, nombre: 'Solicitud general', tipoTramiteId: 100 },
    { id: 6, nombre: 'Tema de trabajo de investigación', tipoTramiteId: 101 },
    { id: 1, nombre: 'Homologación', tipoTramiteId: 102 },
    { id: 11, nombre: 'Crédito condonable', tipoTramiteId: 103 },
    { id: 98, nombre: 'Sin configuración', tipoTramiteId: null },
  ]
  let docs = [], documentFailure = false, catalogFailure = false
  t.beforeEach(() => {
    docs = []; documentFailure = false; catalogFailure = false
    ui.response(url => {
      if (url.startsWith('data:')) return new Response(new Uint8Array([37, 80, 68, 70]))
      const path = new URL(url, 'https://example.test').pathname
      let data
      if (path.endsWith('/tramite/document')) {
        if (documentFailure) return Response.json({ message: 'Checklist no disponible' }, { status: 503 })
        data = docs
      } else if (path.endsWith('/asignaturas')) {
        if (catalogFailure) return Response.json({ message: 'Catálogo no disponible' }, { status: 503 })
        data = [{ id: 7, codigo: 'UIS-7', nombre: 'Investigación avanzada' }]
      } else if (path.endsWith('/homologaciones/asignaturas-externas/activas')) {
        data = [{ id: 3, codigo: 'EXT-3', nombre: 'Métodos de investigación' }]
      } else if (path.endsWith('/modalidadContraprestacion')) {
        data = [{ id: 1, nombre: 'Apoyo docente' }, { id: 2, nombre: 'Edición de revistas científicas' }]
      } else throw new Error(`Petición inesperada: ${url}`)
      return Response.json({ ok: true, data, message: '' })
    })
  })
  const mount = (s, props = {}) => {
    s.after(ui.cleanup)
    return ui.render(createElement(Form, {
      tipos, estudianteId: 18, telefonoEstudiante: '3000000000', correoEstudiante: 'persona@example.test',
      onPreviewCreditoCondonable: async () => [], ...props,
    }))
  }
  const select = async (view, id) => {
    ui.fireEvent.change(view.getByLabelText(/Tipo de trámite/), { target: { value: String(id) } })
    await ui.waitFor(() => assert.equal(Boolean(view.queryByText('Cargando documentos requeridos...')), false))
  }
  const submit = view => ui.fireEvent.submit(view.container.querySelector('form'))

  await t.test('sin tipo o con configuración incompleta no envía solicitudes', async s => {
    const sent = []
    const view = mount(s, { onSubmit: data => sent.push(data) })
    submit(view)
    assert.ok(view.getByText('Debes seleccionar un tipo de trámite.'))
    await select(view, 98)
    submit(view)
    assert.ok(view.getByText(/No es posible registrar la solicitud hasta cargar correctamente/))
    assert.equal(sent.length, 0)
  })

  await t.test('fallo de checklist bloquea registro y cambiar tipo permite recuperarse', async s => {
    documentFailure = true
    const sent = []
    const view = mount(s, { onSubmit: data => sent.push(data) })
    await select(view, 99)
    assert.ok(view.getByText('Checklist no disponible'))
    submit(view)
    assert.equal(sent.length, 0)
    documentFailure = false
    await select(view, 6)
    await select(view, 99)
    submit(view)
    await ui.waitFor(() => assert.equal(sent.length, 1))
  })

  await t.test('exige soporte obligatorio, rechaza PNG y envía PDF sin perder observaciones', async s => {
    docs = [{ id: 5, codigo: 'ANX-1', nombre: 'Certificado', obligatorio: true }]
    const sent = []
    const view = mount(s, { onSubmit: data => sent.push(data) })
    await select(view, 99)
    submit(view)
    assert.ok(view.getByText('Adjunta todos los documentos obligatorios antes de registrar la solicitud.'))
    const input = view.getByLabelText('Seleccionar archivo')
    ui.fireEvent.change(input, { target: { files: [new File(['foto'], 'foto.png', { type: 'image/png' })] } })
    assert.ok(view.getByText('Solo se permiten archivos PDF.'))
    submit(view)
    assert.equal(sent.length, 0)
    const file = new File(['%PDF'], 'certificado.pdf', { type: 'application/pdf' })
    ui.fireEvent.change(input, { target: { files: [file] } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Quitar archivo' }))
    assert.ok(view.getByText('Este documento es obligatorio.'))
    ui.fireEvent.change(input, { target: { files: [file] } })
    ui.fireEvent.change(view.getByLabelText('Observaciones'), { target: { value: 'Solicitud académica de prueba' } })
    submit(view)
    await ui.waitFor(() => assert.ok(view.getByText('Solicitud registrada correctamente.')))
    assert.equal(sent[0].tipoSolicitudId, 99)
    assert.equal(sent[0].observaciones, 'Solicitud académica de prueba')
    assert.equal(sent[0].documentos[0].file, file)
    assert.equal(view.getByLabelText(/Tipo de trámite/).value, '')
  })

  await t.test('fallo de registro conserva datos y habilita el reintento', async s => {
    let attempts = 0
    const view = mount(s, { onSubmit: async () => { if (++attempts === 1) throw new Error('No disponible') } })
    await select(view, 99)
    ui.fireEvent.change(view.getByLabelText('Observaciones'), { target: { value: 'Conservar este texto' } })
    submit(view)
    await ui.waitFor(() => assert.ok(view.getByText('No fue posible registrar la solicitud. Intenta nuevamente.')))
    assert.equal(view.getByLabelText('Observaciones').value, 'Conservar este texto')
    assert.equal(view.getByRole('button', { name: 'Registrar solicitud' }).disabled, false)
    submit(view)
    await ui.waitFor(() => assert.ok(view.getByText('Solicitud registrada correctamente.')))
    assert.equal(attempts, 2)
  })

  await t.test('trabajo de investigación requiere título y resumen, que envía sin espacios extremos', async s => {
    const sent = []
    const view = mount(s, { onSubmit: data => sent.push(data) })
    await select(view, 6)
    submit(view)
    assert.ok(view.getByText(/Debes ingresar el título del trabajo de investigación/))
    ui.fireEvent.change(view.getByLabelText(/Título del trabajo de investigación/), { target: { value: '  Gestión académica  ' } })
    submit(view)
    assert.ok(view.getByText('Debes ingresar el resumen del trabajo de grado.'))
    ui.fireEvent.change(view.getByLabelText(/Resumen del trabajo/), { target: { value: '  Alcance y metodología  ' } })
    submit(view)
    await ui.waitFor(() => assert.equal(sent.length, 1))
    assert.equal(sent[0].tituloTrabajo, 'Gestión académica')
    assert.equal(sent[0].resumenTrabajo, 'Alcance y metodología')
  })

  await t.test('homologación exige pares completos y permite origen de catálogo y manual', async s => {
    const sent = []
    const view = mount(s, { onSubmit: data => sent.push(data) })
    await select(view, 1)
    await view.findByLabelText('Materia origen 1')
    submit(view)
    assert.equal(view.getByLabelText('Materia origen 1').getAttribute('aria-invalid'), 'true')
    assert.equal(sent.length, 0)
    ui.fireEvent.change(view.getByLabelText('Materia origen 1'), { target: { value: '3' } })
    ui.fireEvent.change(view.getByLabelText(/Materia destino del programa/), { target: { value: '7' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Agregar asignaturas' }))
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Asignatura nueva' })[1])
    ui.fireEvent.change(view.getByLabelText('Código materia origen 2'), { target: { value: ' EXT-9 ' } })
    ui.fireEvent.change(view.getByLabelText('Nombre materia origen 2'), { target: { value: ' Seminario externo ' } })
    ui.fireEvent.change(view.getAllByLabelText(/Materia destino del programa/)[1], { target: { value: '7' } })
    submit(view)
    await ui.waitFor(() => assert.equal(sent.length, 1))
    assert.deepEqual(sent[0].solicitudHomologacionesAsignaturas, [
      { asignatura_origen_id: 3, asignatura_destino_id: 7 },
      { nombreAsignaturaExterna: 'Seminario externo', codigoAsignaturaExterna: 'EXT-9', asignatura_destino_id: 7 },
    ])
  })

  await t.test('quitar todos los pares de homologación vuelve a exigir al menos uno', async s => {
    const view = mount(s)
    await select(view, 1)
    await view.findByLabelText('Materia origen 1')
    ui.fireEvent.click(view.getByRole('button', { name: 'Quitar' }))
    submit(view)
    assert.ok(view.getByText('Agrega al menos un par de asignaturas para homologación.'))
    ui.fireEvent.click(view.getByRole('button', { name: 'Agregar asignaturas' }))
    assert.ok(view.getByLabelText('Materia origen 1'))
  })

  await t.test('catálogo fallido impide registrar homologaciones', async s => {
    catalogFailure = true
    const view = mount(s)
    await select(view, 1)
    await view.findByText('Catálogo no disponible')
    submit(view)
    assert.ok(view.getByText('No es posible registrar la solicitud hasta cargar asignaturas de homologación.'))
  })

  await t.test('soportes adicionales limitan archivos PDF y permiten retirar uno', async s => {
    docs = [{ id: 9, codigo: 'ANX-9', nombre: 'Documento soporte adicional', obligatorio: false }]
    const sent = []
    const view = mount(s, { onSubmit: data => sent.push(data) })
    await select(view, 99)
    const files = Array.from({ length: 6 }, (_, i) => new File(['%PDF'], `${i}.pdf`, { type: 'application/pdf' }))
    ui.fireEvent.change(view.getByLabelText('Seleccionar archivos'), { target: { files } })
    assert.equal(view.getByLabelText('Límite alcanzado').disabled, true)
    assert.equal(view.getAllByRole('button', { name: 'Quitar' }).length, 5)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Quitar' })[0])
    submit(view)
    await ui.waitFor(() => assert.equal(sent.length, 1))
    assert.equal(sent[0].documentos.length, 4)
    assert.equal(sent[0].documentos[0].file.name, '1.pdf')
  })
})
