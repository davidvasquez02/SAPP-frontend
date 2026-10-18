import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('matrícula financiera React: liquidación, exclusión, publicación y perfiles', async t => {
  const ui = await reactApiHarness(t)
  const { LiquidacionActions: Actions } = await ui.load('/src/pages/MatriculaFinanciera/LiquidacionActions.tsx')
  const { ProcesoLiquidacionPage: Process } = await ui.load('/src/pages/MatriculaFinanciera/ProcesoLiquidacionPage.tsx')
  const { MatriculaFinancieraPage: Home } = await ui.load('/src/pages/MatriculaFinanciera/MatriculaFinancieraPage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let proceso, fila, writes, failure, changed, hold, release
  const ok = data => Response.json({ ok: true, data })
  t.beforeEach(() => {
    proceso = { id: 9, periodoId: 7, periodo: '2030-1', estado: 'CERRADO', valorSmmlv: 1400000, porcentajeVotacion: 10, porcentajeSalud: 5, baseSalud: 'SMMLV', fechaLimiteRespuesta: '2099-01-01', fechaLimitePago: null, resumen: { convocados: 1, liquidadas: 1, pendientes: 0, respondidas: 0, noLiquidar: 0, conAlertas: 0 } }
    fila = { id: 50, estudianteId: 18, nombreCompleto: 'Persona de prueba', codigoEstudiante: '2026001', estado: 'RESPONDIDA', tipoEstudiante: 'NUEVO', totalFinal: 1000000 }
    writes = []; failure = false; changed = 0; hold = false; release = undefined
    ui.response(async (url, init) => {
      const path = new URL(url, 'https://example.test').pathname
      if (path.endsWith('/programaAcademico')) return ok([{ id: 1, nombre: 'Maestría' }])
      if (path.endsWith('/mias')) return ok([])
      if (path.endsWith('/periodosDisponibles')) return ok([])
      if (path.endsWith('/procesos')) return ok([])
      if (path.endsWith('/procesos/9')) return ok(proceso)
      if (path.endsWith('/procesos/9/liquidaciones')) return ok([])
      if (init.method === 'PUT' || init.method === 'POST') {
        if (hold) await new Promise(resolve => { release = resolve })
        if (failure) return Response.json({ ok: false, message: 'Operación no disponible', data: { estado: 'Verifica el estado del proceso' } }, { status: 409 })
        const body = init.body ? JSON.parse(init.body) : undefined
        writes.push({ path, method: init.method, body })
        if (path.endsWith('/publicar')) { proceso = { ...proceso, estado: 'PUBLICADO', fechaLimitePago: body.fechaLimitePago }; return ok({ enviados: 1, omitidos: [] }) }
        if (path.endsWith('/liquidada')) fila = { ...fila, estado: body.liquidada ? 'LIQUIDADA' : 'RESPONDIDA' }
        else if (path.endsWith('/excluir')) fila = { ...fila, estado: 'NO_LIQUIDAR' }
        else if (path.endsWith('/reincluir')) fila = { ...fila, estado: 'PENDIENTE_RESPUESTA' }
        else throw new Error(`Mutación inesperada: ${path}`)
        return ok(fila)
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mountActions = (s, props = {}) => { s.after(ui.cleanup); return ui.render(createElement(Actions, { fila, proceso, onChange: () => { changed++ }, ...props })) }
  const withProfile = (page, roles) => {
    const user = { id: 10, username: 'persona', nombreCompleto: 'Persona de prueba', roles }
    return createElement(MemoryRouter, { initialEntries: ['/procesos/9'] },
      createElement(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user } } },
        createElement(Routes, null, createElement(Route, { path: '/procesos/:procesoId', element: page }))))
  }
  const mountProcess = s => { s.after(ui.cleanup); return ui.render(withProfile(createElement(Process), ['COORDINADOR'])) }
  const readyProcess = async view => { await view.findByRole('heading', { name: 'Publicar resultados' }) }

  await t.test('confirmar en PUTTY requiere casilla y cancelar no modifica fila', s => {
    const view = mountActions(s)
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar liquidación en PUTTY' }))
    assert.equal(view.getByRole('button', { name: 'Confirmar' }).disabled, true)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cancelar' }))
    assert.equal(writes.length, 0)
  })

  await t.test('confirmación envía liquidación correcta y notifica actualización', async s => {
    const view = mountActions(s)
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar liquidación en PUTTY' }))
    ui.fireEvent.click(view.getByLabelText('Confirmo que esta liquidación ya fue registrada en PUTTY'))
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar' }))
    await view.findByText('Estado actualizado.')
    assert.deepEqual(writes, [{ path: '/api/sapp/liquidacionMatricula/liquidaciones/50/liquidada', method: 'PUT', body: { liquidada: true } }])
    assert.equal(changed, 1)
  })

  await t.test('cambios sin guardar bloquean confirmación financiera', s => {
    const view = mountActions(s, { cambiosSinGuardar: true })
    assert.equal(view.getByRole('button', { name: 'Confirmar liquidación en PUTTY' }).disabled, true)
    assert.equal(writes.length, 0)
  })

  await t.test('excluir exige confirmación y motivo no vacío', async s => {
    const view = mountActions(s)
    ui.fireEvent.click(view.getByRole('button', { name: 'Excluir del proceso' }))
    ui.fireEvent.click(view.getByLabelText('Confirmo que deseo excluir esta liquidación del proceso'))
    assert.equal(view.getByRole('button', { name: 'Confirmar' }).disabled, true)
    ui.fireEvent.change(view.getByLabelText('Motivo de exclusión'), { target: { value: '  No cursa este periodo  ' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar' }))
    await view.findByText('Estado actualizado.')
    assert.equal(writes[0].body.motivo, 'No cursa este periodo')
    assert.ok(writes[0].path.endsWith('/50/excluir'))
  })

  await t.test('reincluir y desmarcar son operaciones explícitas diferentes', async s => {
    fila = { ...fila, estado: 'NO_LIQUIDAR' }
    let view = mountActions(s)
    ui.fireEvent.click(view.getByRole('button', { name: 'Reincluir estudiante' }))
    ui.fireEvent.click(view.getByLabelText('Confirmo que deseo reincluir esta liquidación'))
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar' }))
    await view.findByText('Estado actualizado.')
    assert.ok(writes[0].path.endsWith('/reincluir'))
    assert.equal(writes[0].body, undefined)
    await ui.cleanup()
    fila = { ...fila, estado: 'LIQUIDADA' }
    view = mountActions(s)
    ui.fireEvent.click(view.getByRole('button', { name: 'Desmarcar liquidación' }))
    ui.fireEvent.click(view.getByLabelText('Confirmo que deseo desmarcar esta liquidación'))
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar' }))
    await view.findByText('Estado actualizado.')
    assert.deepEqual(writes[1].body, { liquidada: false })
  })

  await t.test('proceso publicado bloquea modificación de liquidaciones', s => {
    proceso = { ...proceso, estado: 'PUBLICADO' }
    const view = mountActions(s)
    assert.equal(view.getByRole('button', { name: 'Confirmar liquidación en PUTTY' }).disabled, true)
    assert.equal(view.getByRole('button', { name: 'Excluir del proceso' }).disabled, true)
    assert.equal(writes.length, 0)
  })

  await t.test('error de actualización conserva motivo y permite reintentar', async s => {
    failure = true
    const view = mountActions(s)
    ui.fireEvent.click(view.getByRole('button', { name: 'Excluir del proceso' }))
    ui.fireEvent.change(view.getByLabelText('Motivo de exclusión'), { target: { value: 'No corresponde' } })
    ui.fireEvent.click(view.getByLabelText('Confirmo que deseo excluir esta liquidación del proceso'))
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar' }))
    await view.findByRole('alert')
    assert.equal(view.getByLabelText('Motivo de exclusión').value, 'No corresponde')
    assert.equal(changed, 0)
    failure = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar' }))
    await view.findByText('Estado actualizado.')
    assert.equal(writes.length, 1)
  })

  for (const estado of ['pendientes', 'respondidas']) await t.test(`${estado} impiden publicación incluso con confirmación`, async s => {
    proceso.resumen[estado] = 1
    const view = mountProcess(s)
    await readyProcess(view)
    ui.fireEvent.click(view.getByLabelText('Revisé las liquidaciones y confirmo el cierre definitivo de las ediciones.'))
    assert.equal(view.getByRole('button', { name: 'Publicar y notificar' }).disabled, true)
    assert.equal(writes.length, 0)
  })

  await t.test('operación pendiente bloquea otro envío de confirmación', async s => {
    hold = true
    const view = mountActions(s)
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar liquidación en PUTTY' }))
    ui.fireEvent.click(view.getByLabelText('Confirmo que esta liquidación ya fue registrada en PUTTY'))
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar' }))
    await ui.waitFor(() => assert.equal(typeof release, 'function'))
    const button = view.getByRole('button', { name: 'Guardando…' })
    assert.equal(button.disabled, true)
    ui.fireEvent.click(button)
    release()
    await view.findByText('Estado actualizado.')
    assert.equal(writes.length, 1)
  })

  await t.test('publicar exige filas liquidadas y fecha de pago vigente', async s => {
    const view = mountProcess(s)
    await readyProcess(view)
    const button = view.getByRole('button', { name: 'Publicar y notificar' })
    assert.equal(button.disabled, true)
    ui.fireEvent.click(view.getByLabelText('Revisé las liquidaciones y confirmo el cierre definitivo de las ediciones.'))
    ui.fireEvent.change(view.getByLabelText('Fecha límite de pago de las liquidaciones en el sistema de la universidad'), { target: { value: '2000-01-01' } })
    ui.fireEvent.submit(view.container.querySelector('form'))
    assert.equal(writes.length, 0)
    ui.fireEvent.change(view.getByLabelText('Fecha límite de pago de las liquidaciones en el sistema de la universidad'), { target: { value: '2099-01-01' } })
    ui.fireEvent.submit(view.container.querySelector('form'))
    await view.findByText('Proceso publicado.')
    assert.deepEqual(writes, [{ path: '/api/sapp/liquidacionMatricula/procesos/9/publicar', method: 'POST', body: { fechaLimitePago: '2099-01-01' } }])
    await ui.waitFor(() => assert.equal(view.queryAllByRole('button', { name: 'Publicar y notificar' }).length, 0))
  })

  await t.test('sin ninguna fila liquidada no habilita publicación', async s => {
    proceso.resumen.liquidadas = 0
    const view = mountProcess(s)
    await readyProcess(view)
    assert.ok(view.getByText('Se requiere al menos una fila liquidada.'))
    assert.equal(view.getByRole('button', { name: 'Publicar y notificar' }).disabled, true)
  })

  await t.test('publicación rechazada conserva proceso cerrado y no reintenta automáticamente', async s => {
    failure = true
    const view = mountProcess(s)
    await readyProcess(view)
    ui.fireEvent.click(view.getByLabelText('Revisé las liquidaciones y confirmo el cierre definitivo de las ediciones.'))
    ui.fireEvent.change(view.getByLabelText('Fecha límite de pago de las liquidaciones en el sistema de la universidad'), { target: { value: '2099-01-01' } })
    ui.fireEvent.submit(view.container.querySelector('form'))
    await view.findByRole('alert')
    assert.equal(proceso.estado, 'CERRADO')
    assert.equal(writes.length, 0)
    assert.ok(view.getByLabelText('Revisé las liquidaciones y confirmo el cierre definitivo de las ediciones.').checked)
  })

  await t.test('estudiante consulta solo liquidaciones propias; coordinación consulta procesos', async s => {
    s.after(ui.cleanup)
    const start = ui.requests.length
    let view = ui.render(withProfile(createElement(Home), ['ESTUDIANTE']))
    await view.findByText(/No tienes liquidaciones disponibles en esta cuenta/)
    assert.ok(ui.requests.slice(start).some(request => request.url.endsWith('/mias')))
    assert.equal(ui.requests.slice(start).some(request => request.url.endsWith('/procesos')), false)
    assert.equal(view.queryAllByRole('heading', { name: 'Procesos de liquidación' }).length, 0)
    await ui.cleanup()
    const next = ui.requests.length
    view = ui.render(withProfile(createElement(Home), ['SECRETARIA']))
    await view.findByText('No hay procesos para este filtro.')
    assert.ok(ui.requests.slice(next).some(request => request.url.endsWith('/procesos')))
    assert.equal(ui.requests.slice(next).some(request => request.url.endsWith('/mias')), false)
  })
})
