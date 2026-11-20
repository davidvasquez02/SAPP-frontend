import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('gestión de grupos: creación, edición e instituciones', async t => {
  const ui = await reactApiHarness(t)
  const { default: Group } = await ui.load('/src/pages/GestionGruposInvestigacion/GrupoInvestigacionFormPage.tsx')
  const { default: Institution } = await ui.load('/src/pages/GestionGruposInvestigacion/InstitucionFormPage.tsx')
  const { default: List } = await ui.load('/src/pages/GestionGruposInvestigacion/GestionGruposInvestigacionPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const { RUTA_GRUPOS: base } = await ui.load('/src/modules/administracionAcademica/rutas.ts')
  let groups, institutions, failure, writes, reads
  t.beforeEach(() => {
    groups = [{ id: 8, codigo: 'G8', nombre: 'Grupo sintético', institucionId: 2, institucionNombre: 'Escuela sintética', estado: 'ACTIVO', activo: true }]
    institutions = [{ id: 2, nombre: 'Escuela sintética', tipo: 'ESCUELA' }, { id: 3, nombre: 'Facultad sintética', tipo: 'FACULTAD' }]; failure = false; writes = []; reads = []
    ui.response((url, init) => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname
      if (init.method === 'POST' || init.method === 'PUT') {
        writes.push({ path, body: init.body ? JSON.parse(init.body) : null })
        if (failure) return Response.json({ message: 'Operación fallida' }, { status: 409 })
        return Response.json({ ok: true, data: { id: 99, ...writes.at(-1).body } })
      }
      reads.push(u)
      if (failure) return Response.json({ message: 'Catálogo fallido' }, { status: 503 })
      if (path.endsWith('/opciones')) return Response.json({ ok: true, data: institutions.filter(i => i.tipo === u.searchParams.get('tipo')) })
      if (path.endsWith('/grupos')) return Response.json({ ok: true, data: groups })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const Destination = () => h('p', null, `Destino: ${useLocation().state?.mensaje ?? useLocation().state?.seccion ?? 'lista'}`)
  const mount = (s, component, props = {}, edit = false) => {
    s.after(ui.cleanup)
    return ui.render(h(MemoryRouter, { initialEntries: [edit ? '/form/8' : '/form'] }, h(AuthContext.Provider, { value: { user: null, session: null } }, h(Routes, null,
      h(Route, { path: '/form/:grupoId?', element: h(component, props) }), h(Route, { path: base, element: h(Destination) }), h(Route, { path: `${base}/instituciones`, element: h(Destination) })))))
  }
  const change = (v, label, value) => ui.fireEvent.change(v.getByLabelText(label), { target: { value } })
  const submit = v => ui.fireEvent.submit(v.container.querySelector('form'))
  await t.test('grupo exige código, nombre y escuela antes de crear', async s => {
    const v = mount(s, Group); await v.findByLabelText('Código'); submit(v); assert.ok(v.getByText('El código y el nombre del grupo son obligatorios.'))
    change(v, 'Código', '  G9 '); change(v, 'Nombre', ' Grupo nuevo '); submit(v); assert.ok(v.getByText('Selecciona la institución del grupo.'))
    change(v, 'Escuela', '2'); submit(v); await v.findByText(/Destino: Grupo de investigación creado/)
    assert.deepEqual(writes[0].body, { codigo: 'G9', nombre: 'Grupo nuevo', institucionId: 2 })
  })
  await t.test('edición carga valores y actualiza id existente', async s => {
    const v = mount(s, Group, {}, true); await v.findByDisplayValue('G8'); change(v, 'Nombre', 'Nombre actualizado'); submit(v)
    await v.findByText(/Destino: Grupo de investigación actualizado/); assert.ok(writes[0].path.endsWith('/grupos/8'))
  })
  await t.test('grupo inexistente oculta formulario de modificación', async s => {
    groups = []; const v = mount(s, Group, {}, true); await v.findByText('No existe el grupo de investigación indicado.'); assert.equal(v.container.querySelectorAll('form').length, 0)
  })
  await t.test('fallo de guardado conserva valores para reintentar', async s => {
    const v = mount(s, Group, {}, true); await v.findByDisplayValue('G8'); failure = true; submit(v); await v.findByText('Operación fallida')
    assert.equal(v.getByLabelText('Código').value, 'G8'); failure = false; submit(v); await v.findByText(/Destino:/)
  })
  await t.test('escuela exige nombre y facultad, y conserva vínculo numérico', async s => {
    const v = mount(s, Institution, { tipo: 'ESCUELA' }); await v.findByLabelText('Facultad'); submit(v); assert.ok(v.getByText('Escribe el nombre de la escuela.'))
    change(v, 'Nombre', '  Escuela nueva '); submit(v); assert.ok(v.getByText('Selecciona la facultad a la que pertenece la escuela.'))
    change(v, 'Facultad', '3'); submit(v); await v.findByText(/Destino: Escuela/)
    assert.deepEqual(writes[0].body, { nombre: 'Escuela nueva', tipo: 'ESCUELA', institucionPadreId: 3 })
  })
  await t.test('facultad no consulta catálogo padre y se crea sin vínculo', async s => {
    const v = mount(s, Institution, { tipo: 'FACULTAD' }); change(v, 'Nombre', 'Nueva facultad'); submit(v); await v.findByText(/Destino: Facultad/)
    assert.equal(reads.length, 0); assert.equal(writes[0].body.institucionPadreId, null)
  })
  await t.test('institución externa se crea en general: sin facultad ni consulta de catálogo', async s => {
    const v = mount(s, Institution, { tipo: 'EXTERNA' })
    assert.equal(v.queryAllByLabelText('Facultad').length, 0)
    submit(v); assert.ok(v.getByText('Escribe el nombre de la institución externa.'))
    change(v, 'Nombre', '  Universidad de Valencia '); submit(v); await v.findByText(/Destino: Institución externa/)
    assert.equal(reads.length, 0); assert.deepEqual(writes[0].body, { nombre: 'Universidad de Valencia', tipo: 'EXTERNA', institucionPadreId: null })
  })
  await t.test('sin facultades no permite seleccionar padre; cancelar retorna sección', async s => {
    institutions = []; const v = mount(s, Institution, { tipo: 'ESCUELA' }); await v.findByText('Primero registra una facultad')
    assert.equal(v.getByLabelText('Facultad').disabled, true); ui.fireEvent.click(v.getByRole('button', { name: 'Cancelar' })); await v.findByText('Destino: ESCUELA')
  })
  await t.test('listado filtra por búsqueda y limpia parámetros', async s => {
    const v = mount(s, List); await v.findByText('Grupo sintético')
    change(v, 'Buscar por código, nombre o institución', '  G8  ')
    await ui.waitFor(() => assert.ok(reads.some(u => u.searchParams.get('busqueda') === 'G8')))
    ui.fireEvent.click(v.getByRole('button', { name: /Limpiar/ })); await ui.waitFor(() => assert.equal(v.getByLabelText('Buscar por código, nombre o institución').value, ''))
  })
  await t.test('retirar y reactivar conservan id del grupo', async s => {
    const v = mount(s, List); await v.findByText('Grupo sintético'); ui.fireEvent.click(v.getByRole('button', { name: /Retirar/ }))
    await v.findByText(/fue retirado/); assert.ok(writes[0].path.endsWith('/8/desactivar'))
    await ui.cleanup(); groups[0].estado = 'INACTIVO'; groups[0].activo = false
    const v2 = mount(s, List); await v2.findByText('Grupo sintético'); ui.fireEvent.click(v2.getByRole('button', { name: /Reactivar/ })); await v2.findByText(/fue reactivado/)
    assert.ok(writes[1].path.endsWith('/8/reactivar'))
  })
})
