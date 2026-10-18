import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('admisiones: inicio, convocatoria y entrevistas del profesor', async t => {
  const ui = await reactApiHarness(t)
  const { default: Home } = await ui.load('/src/pages/AdmisionesHome/AdmisionesHomePage.tsx')
  const { default: Detail } = await ui.load('/src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx')
  const { default: Professor } = await ui.load('/src/pages/AdmisionesProfesor/AdmisionesProfesorPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const previousRaf = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame')
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: fn => { fn(); return 1 } })
  t.after(() => previousRaf ? Object.defineProperty(globalThis, 'requestAnimationFrame', previousRaf) : delete globalThis.requestAnimationFrame)
  let calls, rows, interviews, fail, mobile, reads
  ui.dom.window.matchMedia = () => ({ matches: mobile, addEventListener() {}, removeEventListener() {} })
  ui.dom.window.requestAnimationFrame = fn => { fn(); return 1 }
  t.beforeEach(() => {
    mobile = false; reads = []; fail = ''
    calls = [{ id: 107, programaId: 1, programa: 'MISI', periodo: '2030-1', vigente: true, cupos: 30, fechaInicio: '2030-01-01', fechaFin: '2030-06-30' }, { id: 108, programaId: 1, programa: 'MISI', periodo: '2029-1', vigente: false, cupos: 20 }, { id: 109, programaId: 2, programa: 'DCC', periodo: '2030-1', vigente: true }]
    rows = Array.from({ length: 13 }, (_, i) => ({ id: 160 + i, aspiranteId: 70 + i, nombreAspirante: `Aspirante prueba ${i + 1}`, estado: i === 0 ? 'ADMITIDO' : 'EN_EVALUACION', numeroDocumento: String(1000 + i), numeroInscripcion: `INS-${i + 1}`, programaAcademico: 'MISI', programaId: 1, periodoAcademico: '2030-1' }))
    interviews = [{ inscripcionId: 160, completa: true }, { inscripcionId: 161, completa: false }]
    ui.response(url => {
      const u = new URL(url, 'https://test.invalid'); const path = u.pathname; reads.push(u)
      if (fail && path.includes(fail)) return Response.json({ message: 'Consulta no disponible' }, { status: 503 })
      if (path.endsWith('/convocatoriaAdmision')) return Response.json({ ok: true, data: calls })
      if (path.includes('/inscripcionAdmision/convocatoria/')) return Response.json({ ok: true, data: path.endsWith('/107') ? rows : [] })
      if (path.includes('/entrevistasPorEvaluador')) return Response.json({ ok: true, data: interviews })
      if (path.includes('/evaluadorConvocatoria/')) return Response.json({ ok: true, data: [{ id: 1, evaluador: 'Evaluador sintético', nombre: 'Evaluador sintético' }] })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const Destination = () => h('p', null, `Destino ${useLocation().pathname}`)
  const mount = (s, component = Home, { roles = ['COORDINADOR_POSGRADOS'], state = {}, id = '107' } = {}) => {
    s.after(ui.cleanup); const user = { id: 10, username: 'sintetico', roles }
    const path = component === Detail ? `/detalle/${id}` : '/inicio'
    return ui.render(h(MemoryRouter, { initialEntries: [{ pathname: path, state }] }, h(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user } } }, h(Routes, null,
      h(Route, { path: component === Detail ? '/detalle/:convocatoriaId' : '/inicio', element: h(component) }), h(Route, { path: '/admisiones/*', element: h(Destination) })))))
  }
  await t.test('inicio agrupa programas y entra a convocatoria vigente', async s => {
    const v = mount(s); await v.findAllByRole('button', { name: /Entrar a la convocatoria/ }); assert.equal(v.getAllByRole('tab').length, 2)
    ui.fireEvent.click(v.getAllByRole('button', { name: /Entrar a la convocatoria/ })[0]); await v.findByText('Destino /admisiones/convocatoria/107')
  })
  await t.test('selector de convocatorias anteriores permite Escape y selección', async s => {
    const v = mount(s); await v.findByRole('button', { name: 'Convocatorias anteriores' }); const picker = v.getByRole('button', { name: 'Convocatorias anteriores' })
    ui.fireEvent.click(picker); ui.fireEvent.keyDown(picker, { key: 'Escape' }); assert.equal(v.queryAllByRole('listbox').length, 0)
    ui.fireEvent.click(picker); ui.fireEvent.click(v.getByRole('option', { name: '2029-1' })); await v.findByText('Destino /admisiones/convocatoria/108')
  })
  await t.test('inicio móvil cambia programa con teclado y respeta perfil de consulta', async s => {
    mobile = true; const v = mount(s, Home, { roles: ['DOCENTE_POSGRADOS'] }); await v.findByRole('tab', { name: 'Maestría' })
    ui.fireEvent.keyDown(v.getByRole('tab', { name: 'Maestría' }), { key: 'End' }); assert.equal(v.getByRole('tab', { name: 'Doctorado' }).getAttribute('aria-selected'), 'true')
    assert.equal(v.queryAllByRole('button', { name: /Configurar fechas/ }).length, 0)
  })
  await t.test('inicio fallido permite reintento y colección vacía tiene mensaje', async s => {
    fail = 'convocatoriaAdmision'; const v = mount(s); await v.findByText(/Consulta no disponible/); fail = ''; calls = []
    ui.fireEvent.click(v.getByRole('button', { name: 'Reintentar' })); await v.findByText('No hay convocatorias disponibles.')
  })
  await t.test('detalle busca aspirante y enlaza inscripción correcta', async s => {
    const v = mount(s, Detail, { state: { programaId: 1, cupos: 30 } }); await v.findByPlaceholderText('Buscar por nombre o código de inscripción')
    ui.fireEvent.change(v.getByPlaceholderText('Buscar por nombre o código de inscripción'), { target: { value: 'INS-13' } }); await v.findByText('Aspirante prueba 13')
    ui.fireEvent.click(v.getByText('Aspirante prueba 13')); await v.findByText('Destino /admisiones/convocatoria/107/inscripcion/172')
  })
  await t.test('cupo lleno y convocatoria cerrada bloquean crear aspirantes', async s => {
    let v = mount(s, Detail, { state: { programaId: 1, cupos: 1 } }); await v.findByText('Cupo completo'); assert.equal(v.getByRole('button', { name: 'Crear aspirante', exact: true }).disabled, true)
    await ui.cleanup(); calls[0].vigente = false; v = mount(s, Detail, { state: { programaId: 1, cupos: 30 } }); await v.findByText('Listado de aspirantes'); assert.equal(v.queryAllByRole('button', { name: 'Crear aspirante', exact: true }).length, 0)
  })
  await t.test('detalle sin filas y fallo de consulta permiten recuperación', async s => {
    rows = []; let v = mount(s, Detail); await v.findByText('No hay aspirantes inscritos en esta convocatoria.'); await ui.cleanup()
    fail = '/inscripcionAdmision/'; v = mount(s, Detail); await v.findByText(/Consulta no disponible/); fail = ''; ui.fireEvent.click(v.getByRole('button', { name: 'Reintentar' })); await v.findByText('No hay aspirantes inscritos en esta convocatoria.')
  })
  await t.test('crear estudiante exige código y correo válidos y permite cancelar', async s => {
    calls[0].vigente = false; const v = mount(s, Detail); await v.findAllByRole('button', { name: 'Crear estudiante', exact: true }); ui.fireEvent.click(v.getAllByRole('button', { name: 'Crear estudiante', exact: true })[0])
    const dialog = v.getByRole('dialog'); ui.fireEvent.submit(dialog.querySelector('form')); assert.ok(v.getByText('El código UIS es obligatorio.'))
    ui.fireEvent.change(ui.within(dialog).getByLabelText(/Código UIS/), { target: { value: '2030123' } }); ui.fireEvent.submit(dialog.querySelector('form')); assert.ok(v.getByText('Ingresa un correo institucional válido.'))
    ui.fireEvent.click(v.getByRole('button', { name: 'Cancelar' })); assert.equal(v.queryAllByRole('dialog').length, 0)
  })
  await t.test('docente consulta solo convocatorias activas y un resumen de entrevistas', async s => {
    const v = mount(s, Professor, { roles: ['DOCENTE_POSGRADOS'] }); await v.findByText('Calificado'); await v.findByText('Pendiente de calificación')
    assert.equal(reads.filter(u => u.pathname.includes('entrevistasPorEvaluador')).length, 1)
    assert.equal(reads.filter(u => u.pathname.endsWith('/convocatoria/108')).length, 0)
    const card = v.getByText('Aspirante prueba 1').closest('article'); ui.fireEvent.keyDown(card, { key: 'Enter' }); await v.findByText('Destino /admisiones/convocatoria/107/inscripcion/160/entrevistas')
  })
  await t.test('perfil administrativo no ejecuta consultas del tablero docente', async s => {
    const v = mount(s, Professor); assert.equal(v.container.textContent, ''); assert.equal(reads.length, 0)
  })
  await t.test('fallo de entrevistas se muestra y permite reintentar', async s => {
    fail = 'entrevistasPorEvaluador'; const v = mount(s, Professor, { roles: ['DOCENTE_POSGRADOS'] }); await v.findByText(/Consulta no disponible/)
    fail = ''; ui.fireEvent.click(v.getByRole('button', { name: 'Reintentar' })); await v.findByText('Calificado')
  })
})
