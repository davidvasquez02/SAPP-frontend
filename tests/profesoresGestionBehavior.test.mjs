import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('profesores: roles, integrantes y director de grupo', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/GestionProfesores/GestionProfesoresPage.tsx')
  const { default: GruposPage } = await ui.load('/src/pages/GestionGruposInvestigacion/ProfesoresGrupoPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let teachers, members, fail, writes
  t.beforeEach(() => {
    teachers = [{ uuid: 'doc-a', fullName: 'Ana sintética', tieneRolDocentePosgrados: true }, { uuid: 'doc-b', fullName: 'Beto sintético', tieneRolDocentePosgrados: false }, { uuid: 'doc-c', fullName: 'Carla sintética', tieneRolDocentePosgrados: true }]
    members = [{ id: 20, docenteId: 20, docenteUuid: 'doc-a', nombre: 'Ana sintética', esDirector: false }]; writes = []; fail = false
    ui.response((url, init) => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname
      if (init.method !== 'GET') {
        writes.push({ path, query: u.searchParams, method: init.method, body: init.body ? JSON.parse(init.body) : null })
        if (fail) return Response.json({ message: 'Cambio no disponible' }, { status: 409 })
        if (path.includes('asignarRol')) teachers[1].tieneRolDocentePosgrados = true
        if (path.endsWith('/rolDocentePosgrados')) teachers[0].tieneRolDocentePosgrados = false
        if (path.endsWith('/director')) members[0].esDirector = true
        if (init.method === 'POST' && path.endsWith('/gruposInvestigacionDocentes')) members.push({ id: 21, docenteId: 21, docenteUuid: 'doc-c', nombre: 'Carla sintética', esDirector: false })
        return Response.json({ ok: true, data: null })
      }
      if (fail) return Response.json({ message: 'Consulta no disponible' }, { status: 503 })
      if (path.endsWith('/docentes')) return Response.json({ ok: true, data: teachers })
      if (path.endsWith('/gruposInvestigacion')) return Response.json({ ok: true, data: [{ id: 8, codigoNombre: 'Grupo sintético', institucionId: 2, facultadId: 3 }] })
      if (path.endsWith('/gruposInvestigacionDocentes')) return Response.json({ ok: true, data: members })
      if (path.endsWith('/opciones')) return Response.json({ ok: true, data: [{ id: u.searchParams.get('tipo') === 'ESCUELA' ? 2 : 3, nombre: u.searchParams.get('tipo'), institucionPadreId: 3 }] })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, Component = Page) => { s.after(ui.cleanup); return ui.render(h(MemoryRouter, null, h(AuthContext.Provider, { value: { session: null, user: null } }, h(Component)))) }
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))
  const group = async v => { await v.findByRole('option', { name: 'Grupo sintético' }); ui.fireEvent.change(v.getByLabelText('Grupo de investigación'), { target: { value: '8' } }); await v.findByRole('button', { name: 'Hacer director' }) }
  await t.test('separa roles, filtra nombre y exige confirmar asignación', async s => {
    const v = mount(s); await v.findByText('Ana sintética'); ui.fireEvent.change(v.getByLabelText('Buscar profesor'), { target: { value: 'Beto' } }); assert.equal(v.queryAllByText('Ana sintética').length, 0)
    click(v, 'Agregar a posgrados'); click(v, 'Cancelar'); assert.equal(writes.length, 0)
    click(v, 'Agregar a posgrados'); click(v, 'Sí, agregar a posgrados'); await v.findByText('El profesor fue agregado a posgrados.'); assert.ok(writes[0].path.includes('doc-b/asignarRol'))
  })
  await t.test('retiro de rol fallido conserva confirmación y permite reintento', async s => {
    const v = mount(s); await v.findByText('Ana sintética'); ui.fireEvent.click(v.getAllByRole('button', { name: 'Retirar de posgrados' })[0]); fail = true; click(v, 'Sí, retirar de posgrados'); await v.findByText(/Cambio no disponible/)
    fail = false; click(v, 'Sí, retirar de posgrados'); await v.findByText('El profesor fue retirado de posgrados.'); assert.equal(writes.length, 2)
  })
  await t.test('grupo excluye integrantes y profesores sin rol de opciones disponibles', async s => {
    const v = mount(s, GruposPage); await group(v)
    assert.equal(v.queryAllByText('Beto sintético').length, 0); assert.equal(v.getAllByText('Ana sintética').length, 1)
    click(v, 'Agregar al grupo'); await v.findByText('Carla sintética fue agregado al grupo de investigación.')
    assert.deepEqual(writes[0].body, { grupoId: 8, docenteUuid: 'doc-c' })
  })
  await t.test('designar director y retirar integrante requieren confirmación', async s => {
    const v = mount(s, GruposPage); await group(v); click(v, 'Hacer director'); click(v, 'Sí, designar director')
    await v.findByText('Ana sintética es ahora el director del grupo de investigación.'); assert.equal(writes[0].query.get('docenteId'), '20')
    click(v, 'Retirar'); click(v, 'Sí, retirar del grupo'); await v.findByText('El docente fue retirado del grupo de investigación.'); assert.equal(writes[1].method, 'DELETE')
  })
  await t.test('cambio de facultad limpia grupo y búsqueda disponible filtra resultados', async s => {
    const v = mount(s, GruposPage); await group(v)
    ui.fireEvent.change(v.getByLabelText('Buscar profesor disponible'), { target: { value: 'inexistente' } }); assert.ok(v.getByText('No hay profesores de posgrados disponibles para agregar.'))
    ui.fireEvent.change(v.getByLabelText('Facultad'), { target: { value: '3' } }); assert.equal(v.getByLabelText('Grupo de investigación').value, ''); assert.ok(v.getByText('Seleccione un grupo para consultar sus docentes.'))
  })
  await t.test('gestión de profesores ya no repite la gestión de grupos', async s => {
    const v = mount(s); await v.findByText('Ana sintética')
    assert.equal(v.queryAllByRole('tab').length, 0); assert.equal(v.queryAllByText('Grupos de investigación').length, 0)
  })
  await t.test('error de catálogo no muestra profesores inventados', async s => {
    fail = true; const v = mount(s); await v.findByText(/Consulta no disponible/); assert.equal(v.queryAllByText('Ana sintética').length, 0)
  })
})
