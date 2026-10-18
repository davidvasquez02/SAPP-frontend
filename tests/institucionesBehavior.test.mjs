import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('instituciones: edición, vínculo de facultad, eliminación y filtros', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/GestionGruposInvestigacion/InstitucionesGrupoPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let items, writes, reads, failure
  t.beforeEach(() => {
    items = [{ id: 2, nombre: 'Escuela sintética', tipo: 'ESCUELA', institucionPadreId: 3, institucionPadreNombre: 'Facultad sintética' }]; writes = []; reads = []; failure = false
    ui.response((url, init) => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname
      if (init.method === 'PUT' || init.method === 'DELETE') {
        writes.push({ path, method: init.method, body: init.body ? JSON.parse(init.body) : null }); if (failure) return Response.json({ message: 'Institución vinculada' }, { status: 409 })
        if (init.method === 'PUT') items[0] = { ...items[0], ...writes.at(-1).body }; else items = []
        return Response.json({ ok: true, data: null })
      }
      reads.push(u)
      if (path.endsWith('/opciones')) return Response.json({ ok: true, data: [{ id: 3, nombre: 'Facultad sintética', tipo: 'FACULTAD' }] })
      if (failure) return Response.json({ message: 'Lista no disponible' }, { status: 503 })
      return Response.json({ ok: true, data: { content: u.searchParams.get('tipo') === 'FACULTAD' ? [{ id: 3, nombre: 'Facultad de prueba', tipo: 'FACULTAD' }] : items, totalElements: items.length, totalPages: 2, number: Number(u.searchParams.get('page')), size: 10 } })
    })
  })
  const mount = s => { s.after(ui.cleanup); return ui.render(h(MemoryRouter, null, h(AuthContext.Provider, { value: { session: null, user: null } }, h(Page)))) }
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))
  const set = (v, label, value) => ui.fireEvent.change(v.getByLabelText(label), { target: { value } })
  await t.test('editar exige nombre y envía facultad elegida con id correcto', async s => {
    const v = mount(s); await v.findByText('Escuela sintética'); click(v, 'Editar'); set(v, 'Nuevo nombre', ' '); click(v, 'Guardar'); assert.ok(v.getByText('El nombre es obligatorio.')); assert.equal(writes.length, 0)
    set(v, 'Nuevo nombre', '  Escuela actualizada  '); set(v, 'Facultad de la escuela', '3'); click(v, 'Guardar'); await v.findByText('Escuela actualizada.')
    assert.deepEqual(writes[0].body, { nombre: 'Escuela actualizada', institucionPadreId: 3 }); assert.ok(writes[0].path.endsWith('/2'))
  })
  await t.test('cancelar edición y eliminación no escribe', async s => {
    const v = mount(s); await v.findByText('Escuela sintética'); click(v, 'Editar'); set(v, 'Nuevo nombre', 'Temporal'); click(v, 'Cancelar'); assert.ok(v.getByText('Escuela sintética'))
    click(v, 'Eliminar'); click(v, 'Cancelar'); assert.equal(writes.length, 0)
  })
  await t.test('eliminación vinculada falla sin quitar fila y admite reintento', async s => {
    const v = mount(s); await v.findByText('Escuela sintética'); click(v, 'Eliminar'); failure = true; click(v, 'Confirmar eliminar'); await v.findByText(/Institución vinculada/); assert.ok(v.getByText('Escuela sintética'))
    failure = false; click(v, 'Eliminar'); click(v, 'Confirmar eliminar'); await v.findByText(/eliminada/); assert.equal(writes.length, 2)
  })
  await t.test('buscar y filtrar facultad envía parámetros y reinicia paginación', async s => {
    const v = mount(s); await v.findByText('Escuela sintética'); click(v, 'Siguiente'); await ui.waitFor(() => assert.ok(reads.some(u => u.searchParams.get('page') === '1')))
    set(v, 'Buscar por nombre', ' Sistemas '); set(v, 'Facultad', '3'); await ui.waitFor(() => assert.ok(reads.some(u => u.searchParams.get('busqueda') === 'Sistemas' && u.searchParams.get('facultadId') === '3' && u.searchParams.get('page') === '0')))
    click(v, 'Limpiar filtros'); assert.equal(v.getByLabelText('Buscar por nombre').value, '')
  })
  await t.test('pestaña facultades consulta tipo correcto y no necesita padre al editar', async s => {
    const v = mount(s); await v.findByText('Escuela sintética'); ui.fireEvent.click(v.getByRole('tab', { name: 'Facultades' })); await v.findByText('Facultad de prueba')
    click(v, 'Editar'); assert.equal(v.queryAllByLabelText('Facultad de la escuela').length, 0); click(v, 'Cancelar')
  })
  await t.test('error de listado no oculta la advertencia', async s => { failure = true; const v = mount(s); await v.findByText(/Lista no disponible/); assert.equal(v.queryAllByText('Escuela sintética').length, 0) })
})
