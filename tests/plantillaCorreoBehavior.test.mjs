import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('plantillas de correo: edición, confirmación y recuperación sin envíos reales', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/PlantillasCorreo/PlantillaCorreoFormPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let template, writes, failure
  t.beforeEach(() => {
    template = { id: 5, sigla: 'PRUEBA', nombre: 'Plantilla sintética', asunto: 'Hola {{nombre}}', idioma: 'ES', descripcion: 'Descripción', contenidoHtml: '<p>Hola {{nombre}}</p>' }; writes = []; failure = false
    ui.response((url, init) => {
      if (failure) return Response.json({ message: 'Plantilla no disponible' }, { status: 503 })
      if (init.method === 'PUT') { const body = JSON.parse(init.body); writes.push(body); template = { ...template, ...body } }
      if (init.method === 'POST') writes.push('prueba')
      return Response.json({ ok: true, data: template, message: 'Prueba simulada aceptada' })
    })
  })
  const mount = s => { s.after(ui.cleanup); return ui.render(h(MemoryRouter, { initialEntries: ['/plantilla/5'] }, h(AuthContext.Provider, { value: { user: null, session: null } }, h(Routes, null, h(Route, { path: '/plantilla/:plantillaId', element: h(Page) }))))) }
  const field = (v, name) => [...v.container.querySelectorAll('.plantillas-correo__campo')].find(e => e.querySelector('.plantillas-correo__campo-etiqueta')?.textContent.startsWith(name))
  const edit = (v, name) => ui.fireEvent.click(ui.within(field(v, name)).getByRole('button', { name: 'Editar' }))
  const done = (v, name) => ui.fireEvent.click(ui.within(field(v, name)).getByRole('button', { name: 'Listo' }))
  const change = (v, name, value) => ui.fireEvent.change(v.getByLabelText(name), { target: { value } })
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))
  await t.test('sin cambios no permite guardar y edición bloquea prueba', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); assert.equal(v.getByRole('button', { name: 'Guardar', exact: true }).disabled, true)
    edit(v, 'Nombre'); change(v, 'Nombre', 'Cambio temporal'); assert.equal(v.getByRole('button', { name: 'Enviar correo de prueba' }).disabled, true)
    ui.fireEvent.click(ui.within(field(v, 'Nombre')).getByRole('button', { name: 'Cancelar' })); assert.ok(v.getByText('Plantilla sintética')); assert.equal(writes.length, 0)
  })
  await t.test('guardar exige terminar edición y confirmar campos modificados', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); edit(v, 'Asunto'); change(v, 'Asunto', '  Asunto actualizado  '); done(v, 'Asunto')
    click(v, 'Guardar'); assert.ok(v.getByText('Revisa los cambios antes de guardar:')); assert.equal(writes.length, 0)
    click(v, 'Seguir editando'); click(v, 'Guardar'); click(v, 'Confirmar y guardar'); await v.findByText('Cambios guardados correctamente.')
    assert.equal(writes[0].asunto, 'Asunto actualizado'); assert.equal(writes[0].contenidoHtml, '<p>Hola {{nombre}}</p>')
  })
  await t.test('campos requeridos vacíos impiden persistencia', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); edit(v, 'Nombre'); change(v, 'Nombre', ' '); done(v, 'Nombre'); click(v, 'Guardar'); click(v, 'Confirmar y guardar')
    await v.findByText('El nombre, el asunto y el contenido son obligatorios.'); assert.equal(writes.length, 0)
  })
  await t.test('vista previa, idioma y descripción preservan el HTML de la plantilla', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética')
    for (const [name, label, value] of [['Idioma', 'Idioma', 'EN'], ['Descripción', 'Descripción', 'Description']]) {
      edit(v, name); change(v, label, value); done(v, name)
    }
    await v.findByText('Hola Laura Gómez')
    const previa = v.getByTitle('Vista previa del correo').getAttribute('srcdoc')
    assert.ok(previa.includes('<p>Hola Laura Gómez</p>'))
    assert.equal(v.getByLabelText('Insertar dato en el mensaje').options[1].textContent, 'Nombre')
    click(v, 'Guardar'); click(v, 'Confirmar y guardar'); await v.findByText('Cambios guardados correctamente.')
    assert.equal(writes[0].idioma, 'EN'); assert.equal(writes[0].descripcion, 'Description')
    assert.equal(writes[0].contenidoHtml, '<p>Hola {{nombre}}</p>')
  })
  await t.test('editar el texto conserva las variables y los atributos del HTML guardado', async s => {
    template.contenidoHtml = '<p style="text-align:center">Hola {{nombre}}</p><a href="{{enlace}}">Inscripción</a>'
    const v = mount(s); await v.findByText('Plantilla sintética')
    assert.equal(ui.within(field(v, 'Mensaje')).queryByRole('button', { name: 'Editar' }), null)
    assert.equal(v.queryByText(/La sigla no se puede cambiar/), null)
    const guardar = v.getByRole('button', { name: 'Guardar', exact: true })
    assert.equal(guardar.disabled, true)
    const iframe = v.getByTitle('Editor del mensaje')
    // jsdom no carga srcdoc. El navegador real también se prueba en integración.
    const documento = iframe.contentDocument
    const fuente = new ui.dom.window.DOMParser().parseFromString(iframe.srcdoc, 'text/html')
    documento.body.innerHTML = fuente.body.innerHTML
    ui.fireEvent.load(iframe)
    const mensaje = documento.querySelector('[aria-label="Mensaje del correo"]')
    assert.equal(mensaje.querySelector('[data-dato-editor]').textContent, 'Nombre')
    mensaje.querySelector('p').firstChild.data = 'Bienvenida '
    ui.fireEvent.input(mensaje)
    assert.equal(guardar.disabled, false)
    assert.equal(v.getByRole('button', { name: 'Enviar correo de prueba' }).disabled, true)
    mensaje.querySelector('p').firstChild.data = 'Hola '
    ui.fireEvent.input(mensaje)
    assert.equal(guardar.disabled, true)
    mensaje.querySelector('p').firstChild.data = 'Bienvenida '
    ui.fireEvent.input(mensaje)
    const previa = v.getByTitle('Vista previa del correo').getAttribute('srcdoc')
    assert.ok(previa.includes('Bienvenida Laura Gómez'))
    assert.ok(previa.includes('href="{{enlace}}"'))
    click(v, 'Guardar'); click(v, 'Confirmar y guardar')
    await v.findByText('Cambios guardados correctamente.')
    assert.equal(guardar.disabled, true)
    assert.equal(writes[0].contenidoHtml, '<p style="text-align:center">Bienvenida {{nombre}}</p><a href="{{enlace}}">Inscripción</a>')
  })
  await t.test('fallo al guardar mantiene confirmación y permite reintentar', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); edit(v, 'Nombre'); change(v, 'Nombre', 'Nombre nuevo'); done(v, 'Nombre'); click(v, 'Guardar'); failure = true; click(v, 'Confirmar y guardar')
    await v.findByText(/Plantilla no disponible/); failure = false; click(v, 'Confirmar y guardar'); await v.findByText('Cambios guardados correctamente.')
  })
  await t.test('prueba simulada usa versión guardada y muestra confirmación', async s => {
    const v = mount(s); await v.findByText('Plantilla sintética'); click(v, 'Enviar correo de prueba'); await v.findByText('Prueba simulada aceptada'); assert.deepEqual(writes, ['prueba'])
  })
  await t.test('error de carga no muestra campos editables', async s => {
    failure = true; const v = mount(s); await v.findByText(/Plantilla no disponible/); assert.equal(v.queryAllByRole('button', { name: 'Guardar', exact: true }).length, 0)
  })
})
