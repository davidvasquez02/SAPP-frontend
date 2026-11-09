import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h, createRef } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('documentos editables y ajustes: validación PDF, carga y reasignación', async t => {
  const ui = await reactApiHarness(t)
  const { default: Editor } = await ui.load('/src/modules/solicitudes/components/SolicitudDocumentosEditor/SolicitudDocumentosEditor.tsx')
  const { default: Adjustments } = await ui.load('/src/modules/trabajos-grado/evaluacion/AjustesEstudiantePanel.tsx')
  let requirements, process, writes, failed, changed, committed
  t.beforeEach(() => {
    requirements = [{ idTipoDocumentoTramite: 4, nombreTipoDocumentoTramite: 'Documento sintético', obligatorioTipoDocumentoTramite: true, documentoCargado: true, documentoUploadedResponse: { idDocumento: 80, nombreArchivoDocumento: 'original.pdf', fechaCargaDocumento: '2030-01-01' } }]
    process = { documentoEvaluarId: 80, documentoEvaluarNombre: 'original.pdf', jurados: [{ nombre: 'Jurado sintético', evaluaciones: [{ observaciones: '  Corregir referencias  ' }] }] }; writes = []; failed = false; changed = 0; committed = 0
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (init.method === 'POST' || init.method === 'PUT') { writes.push({ path, body: init.body ? JSON.parse(init.body) : null }); if (failed) return Response.json({ message: 'Documento no disponible' }, { status: 409 }); return Response.json({ ok: true, data: path.endsWith('/document') ? { id: 81 } : process }) }
      if (failed) return Response.json({ message: 'Consulta no disponible' }, { status: 503 })
      return Response.json({ ok: true, data: path.includes('/procesoEvaluacionTg/') ? process : requirements })
    })
  })
  const mount = (s, Component = Editor, props = {}) => { s.after(ui.cleanup); return ui.render(h(Component, { solicitudId: 60, codigoTipoTramite: '4', usuarioCargaId: 10, editable: true, enAjustes: true, onDocsChanged: () => changed++, onDocsCommitted: () => committed++, onUploaded: () => committed++, ...props })) }
  const file = (v, type = 'application/pdf') => { const bytes = new TextEncoder().encode('%PDF-ajustes'); const f = new ui.dom.window.File([bytes], type === 'application/pdf' ? 'corregido.pdf' : 'imagen.png', { type }); f.arrayBuffer = async () => bytes.buffer; ui.fireEvent.change(v.container.querySelector('input[type=file]'), { target: { files: [f] } }) }
  await t.test('tipo inválido y fallo de checklist se comunican', async s => {
    let v = mount(s, Editor, { codigoTipoTramite: 'invalido' }); await v.findByText('No fue posible determinar el tipo de trámite para cargar documentos.'); await ui.cleanup()
    failed = true; v = mount(s); await v.findByText(/Consulta no disponible/)
  })
  await t.test('solo lectura conserva archivo pero no permite reemplazo', async s => {
    const v = mount(s, Editor, { editable: false }); await v.findByText(/Cargado: original.pdf/); assert.equal(v.container.querySelectorAll('input[type=file]').length, 0); assert.equal(v.queryAllByRole('button', { name: 'Guardar documentos' }).length, 0)
  })
  await t.test('rechaza imágenes y carga PDF con datos correctos y callback posterior', async s => {
    const v = mount(s); await v.findByText('Documento sintético'); file(v, 'image/png'); assert.ok(v.getByText('Solo se permiten archivos PDF.')); assert.equal(changed, 0)
    file(v); await v.findByText('Archivo listo para guardar: corregido.pdf'); ui.fireEvent.click(v.getByRole('button', { name: 'Guardar documentos' })); await ui.waitFor(() => assert.equal(committed, 1))
    assert.equal(writes[0].body.tramiteId, 60); assert.equal(writes[0].body.tipoDocumentoTramiteId, 4); assert.match(writes[0].body.checksum, /^[a-f0-9]{64}$/); assert.equal(changed, 1)
  })
  await t.test('commit imperativo propaga error y conserva archivo para reintentar', async s => {
    const ref = createRef(); const v = mount(s, Editor, { ref, showSaveButton: false }); await v.findByText('Documento sintético'); file(v); failed = true
    await ui.act(async () => { await assert.rejects(ref.current.commitChanges(), /Documento no disponible/) }); assert.equal(committed, 0); assert.ok(v.getByText('Archivo listo para guardar: corregido.pdf'))
    failed = false; await ui.act(async () => ref.current.commitChanges()); assert.equal(committed, 1)
  })
  await t.test('ajustes muestran conceptos y solo reasignan tras carga exitosa', async s => {
    const v = mount(s, Adjustments); await v.findByText('Corregir referencias'); file(v); ui.fireEvent.click(v.getByRole('button', { name: 'Cargar archivo nuevamente' })); await v.findByText('El archivo se cargó correctamente y quedó asignado como el nuevo documento a evaluar.')
    assert.equal(writes.length, 2); assert.ok(writes[0].path.endsWith('/document')); assert.ok(writes[1].path.includes('documento-evaluar')); assert.equal(committed, 1)
  })
  await t.test('ajuste #11/#12: carga la carta de respuestas como documento aparte, sin reasignar el documento evaluado', async s => {
    requirements = [...requirements, { idTipoDocumentoTramite: 7, codigoTipoDocumentoTramite: 'CARTA_RESPUESTAS_TG', nombreTipoDocumentoTramite: 'Carta de respuestas', obligatorioTipoDocumentoTramite: false, documentoCargado: false, documentoUploadedResponse: null }]
    const v = mount(s, Adjustments)
    await v.findByText('Documento sintético')
    const bytes = new TextEncoder().encode('%PDF-carta')
    const cartaFile = new ui.dom.window.File([bytes], 'carta.pdf', { type: 'application/pdf' })
    cartaFile.arrayBuffer = async () => bytes.buffer
    ui.fireEvent.change(v.getByLabelText('Carta de respuestas a las observaciones (opcional)'), { target: { files: [cartaFile] } })
    await v.findByText('Archivo seleccionado: carta.pdf')
    ui.fireEvent.click(v.getByRole('button', { name: 'Cargar carta de respuestas' }))
    await v.findByText('La carta de respuestas se cargó correctamente.')
    assert.equal(writes.length, 1); assert.ok(writes[0].path.endsWith('/document')); assert.equal(writes[0].body.tipoDocumentoTramiteId, 7)
  })
  await t.test('fuera de ajustes no ofrece carga ni consulta checklist', async s => {
    const before = ui.requests.length; const v = mount(s, Adjustments, { enAjustes: false }); await ui.waitFor(() => assert.equal(v.queryAllByText('Consultando el proceso de evaluación…').length, 0)); assert.equal(v.container.textContent, '')
    assert.equal(ui.requests.slice(before).filter(r => r.url.includes('/document?')).length, 0)
  })
  await t.test('ajustes sin requisito relacionado y PDF inválido impiden envío', async s => {
    requirements = []; let v = mount(s, Adjustments); await v.findByText('No fue posible relacionar el documento en evaluación con los requisitos de esta solicitud.'); await ui.cleanup()
    requirements = [{ idTipoDocumentoTramite: 4, documentoUploadedResponse: { idDocumento: 80 } }]; v = mount(s, Adjustments); await v.findByRole('button', { name: 'Cargar archivo nuevamente' }); file(v, 'image/png'); assert.ok(v.getByText('Solo se permiten archivos PDF.')); assert.equal(writes.length, 0)
  })
  await t.test('fallo en carga de ajustes no reasigna documento y permite reintentar', async s => {
    const v = mount(s, Adjustments); await v.findByRole('button', { name: 'Cargar archivo nuevamente' }); file(v); failed = true; ui.fireEvent.click(v.getByRole('button', { name: 'Cargar archivo nuevamente' })); await v.findByText(/Documento no disponible/)
    assert.equal(writes.length, 1); failed = false; ui.fireEvent.click(v.getByRole('button', { name: 'Cargar archivo nuevamente' })); await ui.waitFor(() => assert.equal(committed, 1)); assert.equal(writes.length, 3)
  })
})
