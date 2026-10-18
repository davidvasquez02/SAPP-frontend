import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('configuración académica y créditos: fechas, cierre, historial y filtros', async t => {
  const ui = await reactApiHarness(t)
  const { default: Calls } = await ui.load('/src/pages/ConvocatoriasAdmisionConfig/ConvocatoriasAdmisionConfigPage.tsx')
  const { default: Period } = await ui.load('/src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx')
  const { default: Credits } = await ui.load('/src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const { RUTA_CALENDARIO } = await ui.load('/src/modules/administracionAcademica/rutas.ts')
  const raf = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame')
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: fn => { fn(); return 1 } })
  t.after(() => raf ? Object.defineProperty(globalThis, 'requestAnimationFrame', raf) : delete globalThis.requestAnimationFrame)
  ui.dom.window.requestAnimationFrame = fn => { fn(); return 1 }
  let calls, rows, writes, failure, mobile
  ui.dom.window.matchMedia = () => ({ matches: mobile, addEventListener() {}, removeEventListener() {} })
  t.beforeEach(() => {
    mobile = false; failure = false; writes = []
    calls = [{ id: 107, programaId: 1, programa: 'MISI', periodo: '2030-1', vigente: true, cupos: 10, fechaInicio: '2030-01-01', fechaFin: '2030-06-30', observaciones: 'Convocatoria prueba' }, { id: 108, programaId: 2, programa: 'DCC', periodo: '2029-2', vigente: false, fechaInicio: '', fechaFin: 'fecha inválida' }]
    rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, tipoSolicitudCodigo: 'CRED_COND', tipoSolicitud: 'Crédito', estudianteId: i + 1, estudiante: `Persona ${i + 1}`, codigoEstudianteUis: String(i + 1), estado: 'RADICADA', estadoSigla: 'RAD', observaciones: `Observación ${i + 1}`, fechaRegistro: '2030-01-01', fechaResolucion: null, programaAcademico: 'MISI' }))
    rows.push({ ...rows[0], id: 90, estudianteId: 90, estado: 'APROBADA', estadoSigla: 'APROBADA', observaciones: 'Histórico ' + 'texto '.repeat(40) }, { ...rows[0], id: 91, tipoSolicitudCodigo: 'OTRA', observaciones: 'No crédito' })
    ui.response((url, init) => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname
      if (init.method === 'PUT' || init.method === 'POST') { writes.push({ path, method: init.method, body: init.body ? JSON.parse(init.body) : null }); if (failure) return Response.json({ message: 'Operación fallida' }, { status: 409 }); calls[0].vigente = false; return Response.json({ ok: true, data: null }) }
      if (failure) return Response.json({ message: 'Catálogo fallido' }, { status: 503 })
      if (path.endsWith('/convocatoriaAdmision')) return Response.json({ ok: true, data: calls })
      if (path.endsWith('/withFechas')) return Response.json({ ok: true, data: [{ periodo: { id: 7, anio: 2030, periodo: 1, fechaInicio: '2030-01-01', fechaFin: '2030-06-30' }, fechas: [{ tipoTramite: { id: 1 }, fechaInicio: '2030-01-01', fechaFin: '2030-01-15' }] }] })
      if (path.endsWith('/solicitudesAcademicas')) return Response.json({ ok: true, data: rows })
      if (path.endsWith('/estadosSolicitud')) return Response.json({ ok: true, data: [{ id: 1, sigla: 'RADICADA', nombre: 'Radicada' }, { id: 2, sigla: 'APROBADA', nombre: 'Aprobada' }] })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const Destination = () => h('p', null, `Destino ${useLocation().pathname}`)
  const mount = (s, component = Calls, query = '') => { s.after(ui.cleanup); return ui.render(h(MemoryRouter, { initialEntries: ['/prueba' + query] }, h(AuthContext.Provider, { value: { user: null, session: null } }, h(Routes, null, h(Route, { path: '/prueba', element: h(component) }), h(Route, { path: RUTA_CALENDARIO, element: h(Destination) }), h(Route, { path: '/admisiones/*', element: h(Destination) }), h(Route, { path: '/creditos-condonables/:id', element: h(Destination) }))))) }
  const click = (v, name) => ui.fireEvent.click(v.getByRole('button', { name, exact: true }))
  const set = (v, label, value) => ui.fireEvent.change(v.getByLabelText(label), { target: { value } })
  await t.test('configuración filtra periodo y vigencia y enlaza inscripciones', async s => {
    const v = mount(s); await v.findByText('Convocatoria prueba'); set(v, 'Período', '2030-1'); set(v, 'Vigente', 'CERRADA'); assert.ok(v.getByText('No hay convocatorias para los filtros seleccionados.'))
    set(v, 'Vigente', 'TODOS'); click(v, 'Ver inscripciones'); await v.findByText('Destino /admisiones/convocatoria/107')
  })
  await t.test('cerrar convocatoria requiere confirmación y recarga estado', async s => {
    const v = mount(s); await v.findByText('Convocatoria prueba'); click(v, 'Cerrar'); click(v, 'Cancelar'); assert.equal(writes.length, 0)
    click(v, 'Cerrar'); click(v, 'Cerrar convocatoria'); await v.findByText('Convocatoria cerrada correctamente.'); assert.equal(writes.length, 1); assert.equal(v.queryAllByRole('button', { name: 'Cerrar', exact: true }).length, 0)
  })
  await t.test('carga fallida permite reintento sin mostrar filas antiguas', async s => {
    failure = true; const v = mount(s); await v.findByText(/Catálogo fallido/); failure = false; click(v, 'Reintentar'); await v.findByText('Convocatoria prueba')
  })
  await t.test('crear periodo valida ambos intervalos y fechas obligatorias', async s => {
    const v = mount(s, Period); await ui.waitFor(() => assert.equal(v.getByRole('button', { name: 'Crear período' }).disabled, false)); click(v, 'Crear período'); assert.ok(v.getByText('Debe seleccionar fecha de inicio y fecha fin del semestre.'))
    set(v, 'Fecha inicio', '2030-06-01'); set(v, 'Fecha fin', '2030-01-01'); click(v, 'Crear período'); assert.ok(v.getByText('Debe seleccionar fecha de inicio y fecha fin para matrículas.'))
    set(v, 'Fecha inicio matrículas', '2030-01-20'); set(v, 'Fecha fin matrículas', '2030-01-10'); click(v, 'Crear período'); assert.ok(v.getByText('La fecha inicio del semestre no puede ser mayor que la fecha fin.'))
    set(v, 'Fecha fin', '2030-07-01'); click(v, 'Crear período'); assert.ok(v.getByText('La fecha inicio de matrículas no puede ser mayor que la fecha fin.')); assert.equal(writes.length, 0)
    set(v, 'Fecha fin matrículas', '2030-01-30'); click(v, 'Crear período'); await v.findByText(`Destino ${RUTA_CALENDARIO}`); assert.equal(writes[0].method, 'POST')
  })
  await t.test('periodo existente bloquea año/semestre y usa actualización por id', async s => {
    const v = mount(s, Period, '?periodoId=7'); await v.findByDisplayValue('2030'); assert.equal(v.getByLabelText('Año').disabled, true)
    set(v, 'Fecha inicio matrículas', '2030-01-01'); set(v, 'Fecha fin matrículas', '2030-01-15'); click(v, 'Actualizar período'); await v.findByText(`Destino ${RUTA_CALENDARIO}`); assert.ok(writes[0].path.endsWith('/periodoAcademico/7'))
  })
  await t.test('créditos excluyen otros tipos y separan pendientes de histórico', async s => {
    const v = mount(s, Credits); await v.findByText('Solicitudes pendientes'); await v.findByText('Página 1 de 2'); assert.equal(v.queryAllByText('No crédito').length, 0)
    const pending = v.container.querySelector('#creditos-panel-pendientes'); ui.fireEvent.click(ui.within(pending).getByRole('button', { name: 'Siguiente' })); assert.ok(ui.within(pending).getByText('Página 2 de 2'))
    const history = v.container.querySelector('#creditos-panel-historico'); assert.equal(history.querySelectorAll('tbody tr').length, 1); set(v, 'Estudiante', '90'); click(v, 'Limpiar filtros'); assert.equal(v.getByLabelText('Estudiante').value, '')
  })
  await t.test('tarjeta móvil despliega observación y pestañas admiten teclado', async s => {
    mobile = true; const v = mount(s, Credits); await v.findByRole('tab', { name: /Histórico/ }); await ui.waitFor(() => assert.equal(v.queryAllByText('Cargando solicitudes...').length, 0))
    ui.fireEvent.keyDown(v.getByRole('tab', { name: /Pendientes/ }), { key: 'End' }); assert.equal(v.getByRole('tab', { name: /Histórico/ }).getAttribute('aria-selected'), 'true')
    click(v, 'Ver más'); assert.equal(v.getByRole('button', { name: 'Ver menos' }).getAttribute('aria-expanded'), 'true')
  })
  await t.test('fallo de créditos permite reintentar y recuperar listado', async s => {
    failure = true; const v = mount(s, Credits); await v.findAllByText(/Catálogo fallido/); failure = false; ui.fireEvent.click(v.getAllByRole('button', { name: 'Reintentar' })[0]); await v.findByText('Página 1 de 2')
  })
})
