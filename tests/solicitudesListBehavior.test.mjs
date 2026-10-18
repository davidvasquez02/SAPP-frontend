import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('listados de solicitudes: filtros, separación de asignadas y navegación', async t => {
  const ui = await reactApiHarness(t)
  const { default: Coordinator } = await ui.load('/src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx')
  const { default: Student } = await ui.load('/src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let rows, assigned, fail, queries
  const row = (id, type = 1) => ({ id, tipoSolicitudId: type, tipoSolicitud: type === 1 ? 'OTRA' : 'HOMOLOGACION', estado: 'RADICADA', estadoSigla: 'RAD', estudiante: `Persona ${id}`, codigoEstudianteUis: String(id), programaAcademico: 'MISI', observaciones: `Observación ${id}`, fechaRegistro: '2030-01-01', fechaResolucion: null })
  t.beforeEach(() => {
    rows = Array.from({ length: 12 }, (_, i) => row(i + 1, i % 2 + 1)); assigned = [row(90)]; fail = ''; queries = []
    ui.response(url => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname; queries.push(u)
      if (fail && path.includes(fail)) return Response.json({ ok: false, message: 'Consulta sintética fallida' })
      if (path.endsWith('/tipoSolicitud')) return Response.json({ ok: true, data: [{ id: 1, nombre: 'OTRA' }, { id: 2, nombre: 'HOMOLOGACION' }] })
      if (path.endsWith('/estadosSolicitud')) return Response.json({ ok: true, data: [{ id: 1, sigla: 'RAD', nombre: 'RADICADA' }, { id: 2, sigla: 'APR', nombre: 'APROBADA' }] })
      if (path.endsWith('/asignadas')) return Response.json({ ok: true, data: assigned })
      if (path.endsWith('/solicitudesAcademicas') || path.endsWith('/estudiante')) return Response.json({ ok: true, data: u.searchParams.has('tipoSolicitudId') ? rows.filter(r => r.tipoSolicitudId === Number(u.searchParams.get('tipoSolicitudId'))) : rows })
      if (path.endsWith('/document')) return Response.json({ ok: true, data: [] })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const Detail = () => h('p', null, `Destino ${useLocation().pathname}; asignada=${Boolean(useLocation().state?.fromAssigned)}`)
  const mount = (s, component = Coordinator, props = {}, withStudent = true) => {
    s.after(ui.cleanup)
    const user = { id: 10, roles: ['ESTUDIANTE_POSGRADOS'], persona: {}, estudiante: withStudent ? { id: 7 } : null }
    return ui.render(h(MemoryRouter, { initialEntries: ['/lista'] }, h(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } }, h(Routes, null,
      h(Route, { path: '/lista', element: h(component, { usuarioSappId: 10, ...props }) }), h(Route, { path: '/solicitudes/:id', element: h(Detail) })))))
  }
  const ready = async v => { await v.findByText('Página 1 de 2') }
  const change = (v, label, value) => ui.fireEvent.change(v.getByLabelText(label), { target: { value } })
  await t.test('asignadas se excluyen del listado general y llevan contexto al detalle', async s => {
    assigned = [rows[0]]; const v = mount(s); await ready(v)
    assert.equal(v.getAllByText('Observación 1').length, 1)
    ui.fireEvent.click(v.getByText('Observación 1')); await v.findByText('Destino /solicitudes/1; asignada=true')
  })
  await t.test('paginación y filtro por tipo reinician página y consultan tipo correcto', async s => {
    const v = mount(s); await ready(v); ui.fireEvent.click(v.getByRole('button', { name: 'Siguiente' })); await v.findByText('Página 2 de 2')
    change(v, 'Tipo de solicitud', '2'); await v.findByText('Página 1 de 1')
    assert.ok(queries.some(u => u.searchParams.get('tipoSolicitudId') === '2'))
    assert.equal(v.container.querySelectorAll('[aria-label="Listado de solicitudes"] tbody tr').length, 6)
    ui.fireEvent.click(v.getByRole('button', { name: /Limpiar/ })); await ready(v)
  })
  await t.test('solo asignadas evita consulta del listado general', async s => {
    const v = mount(s, Coordinator, { assignedOnly: true }); await v.findByText('Observación 90')
    assert.equal(queries.filter(u => u.pathname.endsWith('/solicitudesAcademicas')).length, 0)
  })
  await t.test('inclusión, exclusión y filtro de dominio afectan ambas listas', async s => {
    const v = mount(s, Coordinator, { includeTipoSolicitudIds: [1, 2], excludeTipoSolicitudIds: new Set([2]), filterSolicitud: r => r.id > 5, readOnly: true })
    await v.findByText('Observación 11'); assert.equal(v.queryAllByText('Observación 3').length, 0); assert.equal(v.queryAllByText('Observación 12').length, 0)
  })
  await t.test('error de asignadas no se oculta detrás del listado', async s => {
    fail = '/asignadas'; const v = mount(s); await v.findByText('Consulta sintética fallida')
    assert.equal(v.queryAllByText('Observación 90').length, 0)
  })
  await t.test('error general y catálogo se comunican', async s => {
    fail = '/solicitudesAcademicas'; const v = mount(s); await ui.waitFor(() => assert.ok(v.getAllByText('Consulta sintética fallida').length))
  })
  await t.test('estudiante consulta su identificador y pagina sus solicitudes', async s => {
    const v = mount(s, Student); await ready(v)
    assert.ok(queries.some(u => u.pathname.endsWith('/estudiante') && u.searchParams.get('estudianteId') === '7'))
    ui.fireEvent.click(v.getByRole('button', { name: 'Siguiente' })); await v.findByText('Página 2 de 2')
    change(v, 'Tipo de solicitud', '1'); await v.findByText('Página 1 de 1')
    assert.equal(v.container.querySelectorAll('tbody tr').length, 6)
    ui.fireEvent.keyDown(v.container.querySelector('tbody tr'), { key: 'Enter' }); await v.findByText(/Destino \/solicitudes\//)
  })
  await t.test('estudiante sin id no consulta solicitudes', async s => {
    const v = mount(s, Student, {}, false); await v.findByText('No hay estudianteId en sesión')
    assert.equal(queries.filter(u => u.pathname.endsWith('/estudiante')).length, 0)
  })
  await t.test('listado estudiantil aplica restricciones de tipos y permite formulario/cancelación', async s => {
    const v = mount(s, Student, { includeTipoSolicitudIds: [1], filterSolicitud: r => r.id > 5 }); await v.findByText('Observación 11')
    assert.equal(v.container.querySelectorAll('tbody tr').length, 3)
    ui.fireEvent.click(v.getByRole('button', { name: 'Agregar solicitud' })); await v.findByRole('button', { name: /Registrar solicitud/ })
    ui.fireEvent.click(v.getByRole('button', { name: /Volver/ })); await v.findByText('Observación 11')
  })
  await t.test('error de catálogo estudiantil conserva listado visible', async s => {
    fail = 'tipoSolicitud'; const v = mount(s, Student); await ready(v); await v.findByText('Consulta sintética fallida')
    assert.ok(v.container.querySelector('tbody tr'))
  })
})
