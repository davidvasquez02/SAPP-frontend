import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('tarjeta documental React: selección, reemplazo, límites y estados', async t => {
  const ui = await reactApiHarness(t)
  const { DocumentUploadCard } = await ui.load('/src/components/DocumentUploadCard/DocumentUploadCard.tsx')
  const base = { id: 5, codigo: 'ANX-1', nombre: 'Soporte académico', obligatorio: true, status: 'NOT_SELECTED', selectedFile: null }
  const mount = props => ui.render(createElement(DocumentUploadCard, { item: base, onSelectFile: () => {}, ...props }))

  await t.test('pendiente no permite subir; seleccionar, quitar y subir conservan id y archivo', s => {
    s.after(ui.cleanup)
    const selected = [], removed = [], uploaded = []
    const file = new File(['PDF'], 'soporte.pdf', { type: 'application/pdf' })
    const props = { onSelectFile: (...args) => selected.push(args), onRemoveFile: id => removed.push(id), onUpload: id => uploaded.push(id) }
    const view = mount(props)
    assert.equal(view.getByRole('button', { name: 'Subir' }).disabled, true)
    assert.ok(view.getByText('OBLIGATORIO'))
    ui.fireEvent.change(view.getByLabelText('Seleccionar archivo'), { target: { files: [file] } })
    assert.deepEqual(selected, [[5, file]])
    view.rerender(createElement(DocumentUploadCard, { ...props, item: { ...base, status: 'READY_TO_UPLOAD', selectedFile: file } }))
    assert.equal(view.getByRole('button', { name: 'Subir' }).disabled, false)
    ui.fireEvent.click(view.getByRole('button', { name: 'Subir' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Quitar archivo' }))
    assert.deepEqual(uploaded, [5])
    assert.deepEqual(removed, [5])
    ui.fireEvent.change(view.getByLabelText('Seleccionar archivo'), { target: { files: [] } })
    assert.deepEqual(selected.at(-1), [5, null])
  })

  await t.test('subiendo o deshabilitada bloquea acciones; error y rechazo muestran motivo', s => {
    s.after(ui.cleanup)
    const file = new File(['PDF'], 'nuevo.pdf')
    const props = { onSelectFile: () => {}, onUpload: () => {} }
    const view = mount({ ...props, item: { ...base, status: 'UPLOADING', selectedFile: file } })
    assert.equal(view.getByRole('button', { name: 'Subiendo…' }).disabled, true)
    view.rerender(createElement(DocumentUploadCard, { ...props, disabled: true, item: { ...base, status: 'REJECTED', selectedFile: file, uploadedFileName: 'anterior.pdf', rejectionReason: 'Documento ilegible', errorMessage: 'Fallo de red' } }))
    assert.ok(view.getByText('Observación: Documento ilegible'))
    assert.ok(view.getByText('Fallo de red'))
    assert.equal(view.getByRole('button', { name: 'Subir nuevamente' }).disabled, true)
    assert.equal(view.getByLabelText('Reemplazar archivo').disabled, true)
  })

  await t.test('selección múltiple respeta cupos, permite quitar y bloquea al llegar al máximo', s => {
    s.after(ui.cleanup)
    const files = [1, 2, 3].map(n => new File(['PDF'], `${n}.pdf`))
    const added = [], removed = []
    const props = { onSelectFile: () => {}, multiple: true, maxFiles: 2, selectedFiles: [files[0]], onSelectFiles: (...args) => added.push(args), onRemoveSelectedFile: (...args) => removed.push(args) }
    const view = mount(props)
    const input = view.getByLabelText('Seleccionar archivos')
    ui.fireEvent.change(input, { target: { files: files.slice(1) } })
    assert.deepEqual(added, [[5, [files[1]]]])
    assert.equal(input.value, '')
    ui.fireEvent.click(view.getByRole('button', { name: 'Quitar' }))
    assert.deepEqual(removed, [[5, 0]])
    view.rerender(createElement(DocumentUploadCard, { ...props, item: base, selectedFiles: files.slice(0, 2) }))
    assert.equal(view.getByLabelText('Límite alcanzado').disabled, true)
    assert.ok(view.getByText(/2 de 2 seleccionados/))
  })

  await t.test('documento aprobado abre su contenido y libera la URL temporal', s => {
    s.after(ui.cleanup)
    const opened = [], revoked = [], timers = []
    s.mock.method(URL, 'createObjectURL', blob => { assert.equal(blob.type, 'application/pdf'); return 'blob:test-documento' })
    s.mock.method(URL, 'revokeObjectURL', url => revoked.push(url))
    s.mock.method(window, 'open', (...args) => opened.push(args))
    s.mock.method(window, 'setTimeout', callback => { timers.push(callback); return 1 })
    const view = mount({ item: { ...base, status: 'APPROVED', uploadedFileName: 'soporte.pdf', uploadedBase64: 'JVBERi0=', uploadedMimeType: 'application/pdf', obligatorio: false }, onUpload: () => {} })
    assert.ok(view.getByText('OPCIONAL'))
    assert.ok(view.getByText('Aprobado ✅'))
    assert.equal(view.getByRole('button', { name: 'Reemplazar / Subir de nuevo' }).disabled, true)
    ui.fireEvent.click(view.getByRole('button', { name: 'Ver documento' }))
    assert.deepEqual(opened, [['blob:test-documento', '_blank', 'noopener,noreferrer']])
    timers.forEach(fn => fn())
    assert.deepEqual(revoked, ['blob:test-documento'])
  })

  await t.test('foto local obtiene vista previa; archivo no imagen elimina la anterior', async s => {
    s.after(ui.cleanup)
    let file = null
    let view
    const props = { previewAsImage: true, onSelectFile: (_id, selected) => {
      file = selected
      view.rerender(createElement(DocumentUploadCard, { ...props, item: { ...base, selectedFile: file } }))
    } }
    view = mount(props)
    assert.ok(view.getByText('Sin foto'))
    const photo = new ui.dom.window.File(['foto'], 'foto.png', { type: 'image/png' })
    ui.fireEvent.change(view.getByLabelText('Seleccionar foto'), { target: { files: [photo] } })
    await ui.waitFor(() => assert.match(view.getByRole('img').src, /^data:image\/png;base64,/))
    ui.fireEvent.change(view.getByLabelText('Seleccionar foto'), { target: { files: [new File(['PDF'], 'otro.pdf', { type: 'application/pdf' })] } })
    assert.equal(view.queryByRole('img'), null)
    assert.ok(view.getByText('Sin foto'))
  })
})
