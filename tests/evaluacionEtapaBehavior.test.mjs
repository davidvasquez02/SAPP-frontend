import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { MemoryRouter, Outlet, Routes, Route } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('evaluación por etapa: notas, borradores y propiedad de entrevista', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const { evaluacionCache, hojaVidaDocCache } = await ui.load('/src/modules/admisiones/pages/EvaluacionEtapaPage/evaluacionPrefetchCache.ts')
  const draftStore = await ui.load('/src/modules/admisiones/utils/evaluacionDraftStore.ts')
  let items, writes, fail
  const item = (id = 1, owner = 10) => ({ id, evaluadorId: owner, evaluador: `Evaluador ${owner}`, nombre: `Aspecto ${id}`, aspecto: `Aspecto ${id}`, codigo: `ASP${id}`, etapaEvaluacion: 'ENTREVISTA', puntajeMax: 5, puntajeAspirante: 2, observaciones: '', consideraciones: '["Criterio uno", "Criterio dos"]' })
  t.beforeEach(() => {
    evaluacionCache.clear(); hojaVidaDocCache.clear(); for (const e of ['ENTREVISTA', 'HOJA_DE_VIDA', 'EXAMEN_DE_CONOCIMIENTOS']) draftStore.clearEvaluationDrafts(160, e)
    items = [item()]; writes = []; fail = false
    ui.response((url, init) => {
      if (fail) return Response.json({ message: 'Evaluación no disponible' }, { status: 503 })
      if (init.method === 'PUT') { const body = JSON.parse(init.body); writes.push(body); items = items.map(i => ({ ...i, ...body.find(b => b.id === i.id) })); return Response.json({ ok: true }) }
      if (String(url).includes('/document?')) return Response.json({ ok: true, data: [] })
      return Response.json({ ok: true, data: items })
    })
  })
  const mount = (s, { etapa = 'EXAMEN_DE_CONOCIMIENTOS', roles = ['SECRETARIA_POSGRADOS'], final = false, id = '160' } = {}) => {
    s.after(ui.cleanup); const user = { id: 10, roles }
    return ui.render(h(MemoryRouter, { initialEntries: [`/convocatoria/107/inscripcion/${id}/etapa`] }, h(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } }, h(Routes, null,
      h(Route, { path: '/convocatoria/:convocatoriaId/inscripcion/:inscripcionId', element: h(Outlet, { context: { isEstadoFinal: final } }) }, h(Route, { path: 'etapa', element: h(Page, { title: 'Examen', etapa, embedded: true }) }))))))
  }
  const setScore = (v, value, index = 0) => ui.fireEvent.change(v.getAllByLabelText('Nota')[index], { target: { value } })
  const save = v => ui.fireEvent.click(v.getByRole('button', { name: 'Actualizar', exact: true }))
  await t.test('notas vacías, negativas y mayores al máximo bloquean guardar', async s => {
    const v = mount(s); await v.findByLabelText('Nota')
    for (const [value, message] of [['', 'Ingrese un número'], ['-1', 'El puntaje no puede ser negativo'], ['6', 'No puede superar el puntaje máximo']]) {
      setScore(v, value); assert.ok(v.getByText(message)); assert.equal(v.getByRole('button', { name: 'Actualizar' }).disabled, true)
    }
    assert.equal(writes.length, 0)
  })
  await t.test('guardar normaliza observaciones y limpia borradores solo tras éxito', async s => {
    const v = mount(s); await v.findByLabelText('Nota'); setScore(v, '0'); ui.fireEvent.change(v.getByLabelText('Observaciones'), { target: { value: '  Revisado  ' } }); save(v)
    await v.findByText('Calificación guardada correctamente.'); assert.deepEqual(writes, [[{ id: 1, puntajeAspirante: 0, observaciones: 'Revisado' }]])
    assert.equal(draftStore.hasEvaluationDrafts(160), false)
  })
  await t.test('fallo conserva nota y permite reintento', async s => {
    const v = mount(s); await v.findByLabelText('Nota'); setScore(v, '4'); fail = true; save(v); await v.findByText(/Evaluación no disponible/)
    assert.equal(v.getByLabelText('Nota').value, '4'); assert.equal(draftStore.hasEvaluationDrafts(160), true)
    fail = false; save(v); await v.findByText('Calificación guardada correctamente.')
  })
  await t.test('volver a nota original elimina cambio y restaura borrador al remontar', async s => {
    let v = mount(s); await v.findByLabelText('Nota'); setScore(v, '3'); await ui.cleanup()
    v = mount(s); await v.findByDisplayValue('3'); setScore(v, '2'); assert.equal(v.getByRole('button', { name: 'Actualizar' }).disabled, true)
    assert.equal(draftStore.hasEvaluationDrafts(160), false)
  })
  await t.test('estado final deja calificaciones en solo lectura', async s => {
    const v = mount(s, { final: true }); await v.findByLabelText('Nota'); assert.equal(v.getByLabelText('Nota').disabled, true); assert.equal(v.getByRole('button', { name: 'Actualizar' }).disabled, true)
  })
  await t.test('docente solo ve y actualiza aspectos de su entrevista', async s => {
    items.push(item(2, 20)); const v = mount(s, { etapa: 'ENTREVISTA', roles: ['DOCENTE_POSGRADOS'] }); await v.findByLabelText('Nota')
    assert.equal(v.getAllByLabelText('Nota').length, 1); setScore(v, '5'); save(v); await v.findByText('Calificación guardada correctamente.'); assert.equal(writes[0][0].id, 1)
  })
  await t.test('gestión ve otros evaluadores pero no puede editar sus notas', async s => {
    items.push(item(2, 20)); const v = mount(s, { etapa: 'ENTREVISTA' }); await v.findAllByLabelText('Nota')
    assert.equal(v.getAllByLabelText('Nota').filter(e => e.disabled).length, 1)
    const criteria = v.getAllByRole('button', { name: 'Ver criterios' })[0]; ui.fireEvent.click(criteria); assert.equal(criteria.getAttribute('aria-expanded'), 'true')
  })
  await t.test('hoja de vida sin archivo mantiene acciones PDF deshabilitadas y no guarda observaciones', async s => {
    const v = mount(s, { etapa: 'HOJA_DE_VIDA' }); await v.findByText('No se encontró documento de hoja de vida para previsualizar.')
    assert.equal(v.getByRole('button', { name: 'Abrir PDF' }).disabled, true); assert.equal(v.queryAllByLabelText('Observaciones').length, 0)
    setScore(v, '4'); save(v); await v.findByText('Calificación guardada correctamente.'); assert.equal(writes[0][0].observaciones, null)
  })
  await t.test('id inválido y fallo de consulta muestran errores', async s => {
    let v = mount(s, { id: 'invalido' }); await v.findByText('Inscripción inválida.'); await ui.cleanup(); fail = true; v = mount(s); await v.findByText(/Evaluación no disponible/)
  })
})
