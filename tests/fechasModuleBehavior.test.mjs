import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('calendario académico: paginación, filtros, cierre y edición de fechas', async t => {
  const ui = await reactApiHarness(t)
  const previousRaf = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame')
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: fn => { fn(); return 1 } })
  t.after(() => previousRaf ? Object.defineProperty(globalThis, 'requestAnimationFrame', previousRaf) : delete globalThis.requestAnimationFrame)
  const { default: Page } = await ui.load('/src/pages/FechasModule/FechasModulePage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let convocatorias, periods, writes, failure, mobile
  ui.dom.window.requestAnimationFrame = fn => { fn(); return 1 }
  ui.dom.window.matchMedia = () => ({ matches: mobile, addEventListener() {}, removeEventListener() {} })
  t.beforeEach(() => {
    mobile = false; failure = false; writes = []
    periods = Array.from({ length: 5 }, (_, i) => ({ periodo: { id: i + 1, anio: 2030 - i, periodo: 1, anioPeriodo: `${2030 - i} - 1`, fechaInicio: '2030-01-01', fechaFin: '2030-06-30' }, fechas: [] }))
    convocatorias = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, programaId: i === 5 ? 2 : 1, programa: i === 5 ? 'DCC' : 'MISI', periodo: `${2030 - i}-1`, cupos: 10, vigente: i % 2 === 0, fechaInicio: '2030-01-01', fechaFin: '2030-06-30', observaciones: `Convocatoria ${i + 1}` }))
    ui.response((url, init) => {
      const path = new URL(url, 'https://test.invalid').pathname
      if (init.method === 'PUT') {
        writes.push({ path, body: init.body ? JSON.parse(init.body) : null })
        if (failure) return Response.json({ message: 'Operación no disponible' }, { status: 409 })
        if (path.includes('cerrar')) convocatorias[0].vigente = false
        return Response.json({ ok: true, data: null })
      }
      if (failure) return Response.json({ message: 'Fechas no disponibles' }, { status: 503 })
      if (path.endsWith('/withFechas')) return Response.json({ ok: true, data: periods })
      if (path.endsWith('/convocatoriaAdmision')) return Response.json({ ok: true, data: convocatorias })
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const Destination = () => h('p', null, `Destino ${useLocation().pathname}`)
  const mount = s => { s.after(ui.cleanup); return ui.render(h(MemoryRouter, { initialEntries: ['/fechas'] }, h(AuthContext.Provider, { value: { user: null, session: null } }, h(Routes, null, h(Route, { path: '/fechas', element: h(Page) }), h(Route, { path: '/admisiones/convocatoria/:id', element: h(Destination) })))) ) }
  const ready = v => v.findByText('Convocatoria 1')
  const change = (v, label, value) => ui.fireEvent.change(v.getByLabelText(label), { target: { value } })
  await t.test('periodos ordenados y paginados sin mezclar con convocatorias', async s => {
    const v = mount(s); await ready(v); const card = v.getByRole('heading', { name: 'Períodos académicos' }).closest('article'); const scope = ui.within(card)
    assert.equal(card.querySelectorAll('tbody tr').length, 4); ui.fireEvent.click(scope.getByRole('button', { name: 'Siguiente' })); assert.ok(scope.getByText('Página 2 de 2')); assert.ok(scope.getByText('2026 - 1'))
    ui.fireEvent.click(scope.getByRole('button', { name: 'Anterior' })); assert.ok(scope.getByText('2030 - 1'))
  })
  await t.test('filtros de periodo y vigencia restringen resultados', async s => {
    const v = mount(s); await ready(v); change(v, 'Período', '2030-1'); assert.equal(v.queryAllByText('Convocatoria 2').length, 0)
    change(v, 'Vigente', 'CERRADA'); assert.equal(v.queryAllByText('Convocatoria 1').length, 0)
    assert.ok(v.getAllByText('No hay convocatorias para los filtros seleccionados.').length)
  })
  await t.test('ver inscripciones navega con id de convocatoria', async s => {
    const v = mount(s); await ready(v); ui.fireEvent.click(v.getAllByRole('button', { name: 'Ver inscripciones' })[0]); await v.findByText(/Destino \/admisiones\/convocatoria\//)
  })
  await t.test('cierre requiere confirmación; cancelar y Escape no escriben', async s => {
    const v = mount(s); await ready(v); ui.fireEvent.click(v.getAllByRole('button', { name: 'Cerrar', exact: true })[0]); ui.fireEvent.click(v.getByRole('button', { name: 'Cancelar' })); assert.equal(writes.length, 0)
    ui.fireEvent.click(v.getAllByRole('button', { name: 'Cerrar', exact: true })[0]); ui.fireEvent.keyDown(ui.dom.window, { key: 'Escape' }); assert.equal(v.queryAllByRole('dialog').length, 0)
    ui.fireEvent.click(v.getAllByRole('button', { name: 'Cerrar', exact: true })[0]); ui.fireEvent.click(v.getByRole('button', { name: 'Cerrar convocatoria', exact: true })); await v.findByText('Convocatoria cerrada correctamente.'); assert.equal(writes.length, 1)
  })
  await t.test('edición rechaza fechas invertidas y envía solo fecha modificada', async s => {
    const v = mount(s); await ready(v); const row = v.getByText('Convocatoria 1').closest('tr'); ui.fireEvent.click(ui.within(row).getByRole('button', { name: 'Editar' }))
    change(v, 'Fecha de fin', '2029-01-01'); ui.fireEvent.submit(v.getByRole('dialog').querySelector('form')); assert.ok(v.getByText('La fecha de fin no puede ser anterior a la fecha de inicio.')); assert.equal(writes.length, 0)
    change(v, 'Fecha de fin', '2030-07-01'); ui.fireEvent.click(v.getByRole('button', { name: 'Guardar cambios' })); await v.findByText('Fechas de la convocatoria actualizadas correctamente.')
    assert.deepEqual(writes[0].body, { fechaFin: '2030-07-01' })
  })
  await t.test('modo móvil permite cambiar programa con teclado', async s => {
    mobile = true; const v = mount(s); await ready(v); const first = v.getByRole('tab', { name: 'Maestría' }); await ui.waitFor(() => assert.equal(first.getAttribute('aria-selected'), 'true'))
    ui.fireEvent.keyDown(first, { key: 'ArrowRight' }); assert.equal(v.getByRole('tab', { name: 'Doctorado' }).getAttribute('aria-selected'), 'true')
    ui.fireEvent.keyDown(v.getByRole('tab', { name: 'Doctorado' }), { key: 'Home' }); assert.equal(first.getAttribute('aria-selected'), 'true')
  })
  await t.test('fallo de catálogo muestra error y oculta datos parciales', async s => {
    failure = true; const v = mount(s); await v.findByText(/Fechas no disponibles/); assert.equal(v.queryAllByRole('button', { name: 'Crear convocatoria' }).length, 0)
  })
})
