import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('crédito condonable React: previsualización, renovación y documentos generados', async t => {
  const ui = await reactApiHarness(t)
  const { default: Form } = await ui.load('/src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx')
  const tipos = [
    { id: 11, nombre: 'Crédito condonable', tipoTramiteId: 103 },
    { id: 12, nombre: 'Renovación crédito condonable', tipoTramiteId: 104 },
    { id: 99, nombre: 'Solicitud general', tipoTramiteId: 100 },
  ]
  const pdf = { base64DocumentoContenido: 'JVBERi0=', mimeTypeDocumentoContenido: 'application/pdf', tipoDocumentoId: 5, tipoDocumentoCodigo: 'CRED-1', tipoDocumentoNombre: 'Solicitud generada' }
  let modalFailure, generated, previewError, received, sent, revoked, objectUrl
  t.beforeEach(s => {
    modalFailure = false; generated = [pdf]; previewError = null; received = []; sent = []; revoked = []; objectUrl = 0
    s.mock.method(URL, 'createObjectURL', () => `blob:credito-${++objectUrl}`)
    s.mock.method(URL, 'revokeObjectURL', url => revoked.push(url))
    ui.response(url => {
      if (url.startsWith('data:')) return new Response(new Uint8Array([37, 80, 68, 70]), { headers: { 'Content-Type': 'application/pdf' } })
      if (url.includes('/tramite/document')) return Response.json({ ok: true, data: [
        { id: 5, codigo: 'CRED-1', nombre: 'Solicitud de crédito', obligatorio: true },
        { id: 6, codigo: 'ANEXO', nombre: 'Anexo de actividades', obligatorio: false },
      ] })
      if (url.endsWith('/modalidadContraprestacion')) return modalFailure
        ? Response.json({ message: 'Modalidades no disponibles' }, { status: 503 })
        : Response.json({ ok: true, data: [{ id: 1, nombre: 'Apoyo docente' }, { id: 2, nombre: 'Edición de revistas científicas' }] })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, props = {}) => {
    s.after(ui.cleanup)
    return ui.render(createElement(Form, {
      tipos, estudianteId: 18, telefonoEstudiante: ' 3000000000 ', correoEstudiante: ' persona@example.test ',
      onSubmit: payload => sent.push(payload),
      onPreviewCreditoCondonable: async payload => { received.push(payload); if (previewError) throw previewError; return generated },
      ...props,
    }))
  }
  const change = (input, value) => ui.fireEvent.change(input, { target: { value } })
  const choose = async (view, id = 11) => {
    change(view.getByLabelText(/Tipo de trámite/), String(id))
    await view.findByLabelText(/Modalidad de contraprestación/)
    await ui.waitFor(() => assert.ok(!view.queryByText('Cargando documentos requeridos...')))
  }
  const fill = async (view, id = 11) => {
    await choose(view, id)
    change(view.getByLabelText(/Modalidad de contraprestación/), '1')
    change(view.getByPlaceholderText(id === 12 ? 'Actividad 1' : 'Motivo 1'), '  Apoyo a investigación  ')
    const city = view.getByLabelText('Municipio/Ciudad')
    change(city, 'bucaramanga')
    ui.fireEvent.keyDown(city, { key: 'ArrowDown' })
    ui.fireEvent.keyDown(city, { key: 'Enter' })
    ui.fireEvent.blur(city)
    assert.equal(city.value, 'Bucaramanga')
  }
  const preview = view => ui.fireEvent.click(view.getByRole('button', { name: 'Previsualizar documento de solicitud' }))
  const submit = view => ui.fireEvent.submit(view.container.querySelector('form'))

  await t.test('exige modalidad, motivos, municipio válido y documento obligatorio', async s => {
    const view = mount(s)
    await choose(view)
    assert.equal(view.getByRole('button', { name: 'Previsualizar documento de solicitud' }).disabled, true)
    submit(view)
    assert.ok(view.getByText(/Debes seleccionar la modalidad de contraprestación/))
    change(view.getByLabelText(/Modalidad de contraprestación/), '1')
    submit(view)
    assert.ok(view.getByText(/Debes agregar al menos un motivo/))
    change(view.getByPlaceholderText('Motivo 1'), 'Apoyo docente')
    change(view.getByLabelText('Municipio/Ciudad'), 'Ciudad inexistente')
    assert.ok(view.getByText('No hay municipios que coincidan'))
    submit(view)
    assert.ok(view.getByText('Selecciona un municipio válido del departamento de expedición.'))
    change(view.getByLabelText('Municipio/Ciudad'), 'Bucaramanga')
    submit(view)
    assert.ok(view.getByText('Adjunta todos los documentos obligatorios antes de registrar la solicitud.'))
    assert.equal(sent.length, 0)
  })

  await t.test('fallo del catálogo bloquea registro y cambiar tipo permite recuperarse', async s => {
    modalFailure = true
    const view = mount(s)
    change(view.getByLabelText(/Tipo de trámite/), '11')
    await view.findByText('Modalidades no disponibles')
    submit(view)
    assert.ok(view.getByText('No es posible registrar la solicitud hasta cargar la modalidad de contraprestación.'))
    assert.equal(sent.length, 0)
    modalFailure = false
    change(view.getByLabelText(/Tipo de trámite/), '99')
    await fill(view)
    assert.equal(view.getByRole('button', { name: 'Previsualizar documento de solicitud' }).disabled, false)
  })

  await t.test('genera varios PDF, selecciona vista y adjunta por id o código sin perder contenido', async s => {
    generated = [pdf, { ...pdf, tipoDocumentoId: null, tipoDocumentoCodigo: 'ANEXO', tipoDocumentoNombre: 'Anexo generado' }]
    const view = mount(s)
    await fill(view)
    ui.fireEvent.click(view.getByRole('button', { name: '+ Agregar motivo' }))
    change(view.getByPlaceholderText('Motivo 2'), '  Formación docente  ')
    preview(view)
    await view.findByTitle('Previsualización de Solicitud generada')
    assert.deepEqual(received[0], {
      estudianteId: 18, tipoSolicitudId: 11, observaciones: 'Solicitud de crédito condonable', modalidadId: 1,
      motivosCreditoCondonable: ['Apoyo a investigación', 'Formación docente'], ciudadExpedicionDocumento: 'Bucaramanga',
    })
    ui.fireEvent.click(view.getByRole('button', { name: 'Anexo generado' }))
    assert.equal(view.getByTitle('Previsualización de Anexo generado').getAttribute('src'), 'blob:credito-2')
    ui.fireEvent.click(view.getByRole('button', { name: 'Cargar todos los documentos generados' }))
    assert.ok(view.getByText('Archivo: cred-1.pdf'))
    assert.ok(view.getByText('Archivo: anexo.pdf'))
    submit(view)
    await view.findByText('Solicitud registrada correctamente.')
    assert.equal(sent[0].documentos.length, 2)
    for (const item of sent[0].documentos) {
      assert.equal(item.file.type, 'application/pdf')
      assert.equal(await item.file.text(), '%PDF')
    }
    assert.deepEqual(revoked.sort(), ['blob:credito-1', 'blob:credito-2'])
  })

  await t.test('documentos generados ajenos al checklist no satisfacen requisitos', async s => {
    generated = [{ ...pdf, tipoDocumentoId: 800, tipoDocumentoCodigo: 'AJENO' }]
    const view = mount(s)
    await fill(view)
    preview(view)
    await view.findByTitle('Previsualización de Solicitud generada')
    ui.fireEvent.click(view.getByRole('button', { name: 'Cargar todos los documentos generados' }))
    assert.ok(view.getByText(/Ningún documento generado coincide/))
    submit(view)
    assert.equal(sent.length, 0)
  })

  await t.test('coincidencia parcial informa cuántos documentos pudo adjuntar', async s => {
    generated = [pdf, { ...pdf, tipoDocumentoId: 800, tipoDocumentoCodigo: 'AJENO', tipoDocumentoNombre: 'Ajeno' }]
    const view = mount(s)
    await fill(view)
    preview(view)
    await view.findByTitle('Previsualización de Solicitud generada')
    ui.fireEvent.click(view.getByRole('button', { name: 'Cargar todos los documentos generados' }))
    assert.ok(view.getByText('Se cargaron 1 de 2 documentos; algunos no coinciden con el listado.'))
    assert.ok(view.getByText('Archivo: cred-1.pdf'))
    assert.equal(view.queryAllByText('Archivo: ajeno.pdf').length, 0)
  })

  await t.test('error de previsualización conserva formulario y permite reintentar', async s => {
    previewError = new Error('No fue posible generar el certificado')
    const view = mount(s)
    await fill(view)
    preview(view)
    await view.findByText('No fue posible generar el certificado')
    assert.equal(view.getByPlaceholderText('Motivo 1').value, '  Apoyo a investigación  ')
    previewError = null
    preview(view)
    await view.findByTitle('Previsualización de Solicitud generada')
    change(view.getByLabelText(/Modalidad de contraprestación/), '2')
    assert.equal(view.queryAllByTitle(/Previsualización/).length, 0)
    assert.deepEqual(revoked, ['blob:credito-1'])
  })

  await t.test('renovación habilita preview solo con periodo, dirección, horas y contacto válidos', async s => {
    const view = mount(s)
    await fill(view, 12)
    const button = view.getByRole('button', { name: 'Previsualizar documento de solicitud' })
    assert.equal(button.disabled, true)
    change(view.getByLabelText(/Dirección de residencia/), '  Calle de prueba  ')
    change(view.getByLabelText(/Periodo de inicio/), '2025-3')
    change(view.getByLabelText(/Intensidad horaria semanal/), '4')
    change(view.getByLabelText(/Horas del semestre/), '64')
    assert.equal(button.disabled, true)
    change(view.getByLabelText(/Periodo de inicio/), '2025-2')
    change(view.getByLabelText(/Horas del semestre/), '0')
    assert.equal(button.disabled, true)
    change(view.getByLabelText(/Horas del semestre/), '64')
    assert.equal(button.disabled, false)
    preview(view)
    await view.findByTitle('Previsualización de Solicitud generada')
    assert.deepEqual(received[0], {
      estudianteId: 18, tipoSolicitudId: 12, modalidadId: 1, observaciones: 'Solicitud de crédito condonable',
      actividadesCreditoCondonable: ['Apoyo a investigación'], periodoAcademicoInicioCreditoCon: '2025-2',
      direccionEstudiante: 'Calle de prueba', telefonoEstudiante: '3000000000', correoEstudiante: 'persona@example.test',
      intensidadHorariaSemanal: 4, horasSemestre: 64, ciudadExpedicionDocumento: 'Bucaramanga',
    })
  })

  await t.test('renovación sin contacto no permite generar documentos', async s => {
    const view = mount(s, { telefonoEstudiante: '', correoEstudiante: '' })
    await fill(view, 12)
    assert.ok(view.getByText('La sesión no contiene teléfono y correo suficientes para generar la previsualización.'))
    assert.equal(view.getByRole('button', { name: 'Previsualizar documento de solicitud' }).disabled, true)
    assert.equal(received.length, 0)
  })

  await t.test('edición de revistas usa archivos directos y no requiere generación', async s => {
    const view = mount(s)
    await choose(view)
    change(view.getByLabelText(/Modalidad de contraprestación/), '2')
    assert.equal(view.queryAllByRole('button', { name: 'Previsualizar documento de solicitud' }).length, 0)
    ui.fireEvent.change(view.getAllByLabelText('Seleccionar archivo')[0], { target: { files: [new File(['%PDF'], 'revista.pdf', { type: 'application/pdf' })] } })
    submit(view)
    await view.findByText('Solicitud registrada correctamente.')
    assert.equal(sent[0].modalidadId, 2)
    assert.equal(sent[0].documentos[0].file.name, 'revista.pdf')
    assert.equal(received.length, 0)
  })
})
