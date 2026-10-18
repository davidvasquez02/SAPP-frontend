import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('convocatorias React: fechas, duplicados, periodo y asignación de evaluadores', async t => {
  const ui = await reactApiHarness(t)
  const { CreateConvocatoriaModal: Form } = await ui.load('/src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx')
  const initialRows = []
  let periods, creations, assignments, periodWrites, catalogFailure, duplicate, assignmentFailure, missingId, periodFailure, success, closed
  t.beforeEach(() => {
    periods = [{ id: 7, anioPeriodo: '2030 - 1' }]; creations = []; assignments = []; periodWrites = []; catalogFailure = false; duplicate = false; assignmentFailure = false; missingId = false; periodFailure = false; success = []; closed = 0
    ui.response((url, init) => {
      const path = new URL(url, 'https://example.test').pathname
      if (path.endsWith('/docentes')) return catalogFailure ? Response.json({ message: 'No disponible' }, { status: 503 }) : Response.json({ ok: true, data: [
        { uuid: 'uuid-prof', fullName: 'Ana de prueba', tieneRolDocentePosgrados: true },
        { uuid: 'uuid-auto', fullName: 'Luis Carlos Gomez Florez', tieneRolDocentePosgrados: true },
        { uuid: 'uuid-sin-rol', fullName: 'Sin rol docente', tieneRolDocentePosgrados: false },
      ] })
      if (path.endsWith('/programaAcademico')) return Response.json({ ok: true, data: [{ id: 1, nombre: 'Maestría', codigoUis: 'MISI' }] })
      if (path.endsWith('/periodoAcademico')) return Response.json({ ok: true, data: periods })
      if (path.endsWith('/periodoAcademicoFecha')) {
        periodWrites.push(JSON.parse(init.body))
        return periodFailure ? Response.json({ message: 'Fechas no disponibles' }, { status: 503 }) : Response.json({ ok: true, data: null })
      }
      if (path.endsWith('/convocatoriaAdmision')) {
        if (duplicate) return Response.json({ message: 'duplicate key uq_convocatoria' }, { status: 409 })
        creations.push(JSON.parse(init.body))
        return Response.json({ ok: true, data: missingId ? null : { id: 107 } })
      }
      if (path.endsWith('/evaluadorConvocatoria')) {
        assignments.push(JSON.parse(init.body))
        return assignmentFailure ? Response.json({ message: 'Asignación no disponible' }, { status: 503 }) : Response.json({ ok: true, data: null })
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = s => {
    s.after(ui.cleanup)
    return ui.render(createElement(Form, { open: true, convocatorias: initialRows, initialProgramaId: 1, onClose: () => { closed++ }, onSuccess: value => success.push(value), onRefreshConvocatorias: async () => creations.map(body => ({ ...body, id: 107 })) }))
  }
  const set = (view, label, value) => ui.fireEvent.change(view.getByLabelText(label), { target: { value } })
  const ready = async view => {
    await view.findByRole('option', { name: 'Ana de prueba' })
    set(view, /^Año/, '2030')
    await ui.waitFor(() => assert.equal(view.getByLabelText(/^Fecha inicio/).value, '2030-01-01'))
  }
  const submit = view => ui.fireEvent.submit(view.container.querySelector('form'))
  const addProfesor = view => {
    const picker = view.getAllByRole('combobox').find(select => [...select.options].some(option => option.value === 'uuid-prof'))
    ui.fireEvent.change(picker, { target: { value: 'uuid-prof' } })
  }

  await t.test('año inválido y cupos no positivos no crean periodo ni convocatoria', async s => {
    const view = mount(s)
    await ready(view)
    set(view, /^Año/, '1999'); set(view, /^Cupos/, '0')
    submit(view)
    assert.ok(view.getByText('Ingrese un año válido entre 2000 y 2100.'))
    assert.ok(view.getByText('Los cupos deben ser mayores a 0.'))
    assert.equal(creations.length, 0)
    assert.equal(periodWrites.length, 0)
  })

  await t.test('fechas vacías o invertidas impiden crear', async s => {
    const view = mount(s)
    await ready(view)
    set(view, /^Fecha inicio/, ''); set(view, /^Fecha fin/, '')
    submit(view)
    assert.ok(view.getByText('La fecha de inicio es obligatoria.'))
    assert.ok(view.getByText('La fecha de fin es obligatoria.'))
    set(view, /^Fecha inicio/, '2030-03-01'); set(view, /^Fecha fin/, '2030-02-01')
    submit(view)
    assert.ok(view.getByText('La fecha de fin no puede ser menor a la fecha de inicio.'))
    assert.equal(creations.length, 0)
  })

  await t.test('semestre propone fechas pero respeta las modificadas manualmente', async s => {
    const view = mount(s)
    await ready(view)
    set(view, /^Semestre/, '2')
    assert.equal(view.getByLabelText(/^Fecha inicio/).value, '2030-07-01')
    assert.equal(view.getByLabelText(/^Fecha fin/).value, '2030-12-31')
    set(view, /^Fecha inicio/, '2030-08-01')
    set(view, /^Semestre/, '1')
    assert.equal(view.getByLabelText(/^Fecha inicio/).value, '2030-08-01')
  })

  await t.test('evaluadores automáticos no se duplican y adicionales pueden retirarse', async s => {
    const view = mount(s)
    await ready(view)
    assert.ok(view.getByText('Coordinador Posgrados'))
    assert.equal(view.queryAllByRole('option', { name: 'Luis Carlos Gomez Florez' }).length, 0)
    assert.equal(view.queryAllByRole('option', { name: 'Sin rol docente' }).length, 0)
    addProfesor(view)
    assert.equal(view.queryAllByRole('option', { name: 'Ana de prueba' }).length, 0)
    ui.fireEvent.click(view.getByRole('button', { name: 'Quitar' }))
    assert.ok(view.getByRole('option', { name: 'Ana de prueba' }))
  })

  await t.test('periodo existente se reutiliza sin crear nuevas fechas', async s => {
    const view = mount(s)
    await ready(view)
    set(view, /^Cupos/, '8')
    submit(view)
    await ui.waitFor(() => assert.equal(success.length, 1))
    assert.deepEqual(creations, [{ programaId: 1, periodoId: 7, cupos: 8, fechaInicio: '2030-01-01', fechaFin: '2030-06-30', observaciones: '' }])
    assert.equal(periodWrites.length, 0)
    assert.equal(assignments.length, 0)
    assert.equal(closed, 1)
  })

  await t.test('periodo ausente crea sus fechas antes de registrar convocatoria', async s => {
    periods = [{ id: 7, anioPeriodo: '2029 - 2' }]
    const view = mount(s)
    await ready(view)
    submit(view)
    await ui.waitFor(() => assert.equal(success.length, 1))
    assert.equal(periodWrites[0].periodoId, 8)
    assert.equal(periodWrites[0].fechaInicio, '2030-01-01')
    assert.equal(creations[0].periodoId, 8)
  })

  await t.test('fallo creando fechas no continúa con convocatoria', async s => {
    periods = []; periodFailure = true
    const view = mount(s)
    await ready(view)
    submit(view)
    await view.findByText(/No se pudo crear el periodo/)
    assert.equal(creations.length, 0)
    assert.equal(closed, 0)
  })

  await t.test('duplicado muestra mensaje del periodo y conserva formulario', async s => {
    duplicate = true
    const view = mount(s)
    await ready(view)
    submit(view)
    await view.findByText('Ya existe una convocatoria para el programa seleccionado en el período académico 2030-1.')
    assert.equal(success.length, 0)
    assert.equal(closed, 0)
  })

  await t.test('asignación fallida reintenta solo profesores sin duplicar convocatoria', async s => {
    assignmentFailure = true
    const view = mount(s)
    await ready(view)
    addProfesor(view)
    submit(view)
    await view.findByText(/Convocatoria creada, pero no se pudieron asignar profesores/)
    assert.equal(creations.length, 1)
    assert.equal(view.getByLabelText(/^Año/).disabled, true)
    assignmentFailure = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Reintentar asignación' }))
    await ui.waitFor(() => assert.equal(success.length, 1))
    assert.equal(creations.length, 1)
    assert.deepEqual(assignments, [{ evaluadorUuid: 'uuid-prof', convocatoriaId: 107 }, { evaluadorUuid: 'uuid-prof', convocatoriaId: 107 }])
  })

  await t.test('respuesta sin id resuelve convocatoria por consulta antes de asignar', async s => {
    missingId = true
    const view = mount(s)
    await ready(view)
    addProfesor(view)
    submit(view)
    await ui.waitFor(() => assert.equal(success.length, 1))
    assert.equal(assignments[0].convocatoriaId, 107)
    assert.equal(creations.length, 1)
  })

  await t.test('catálogo fallido muestra error sin aparentar una creación exitosa', async s => {
    catalogFailure = true
    const view = mount(s)
    await view.findByText('No fue posible cargar el catálogo de profesores.')
    assert.equal(creations.length, 0)
    assert.equal(success.length, 0)
  })
})
