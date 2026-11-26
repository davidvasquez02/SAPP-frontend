import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('revisión de matrícula React: documentos, asignaturas y finalización', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx')
  const { default: Historial } = await ui.load('/src/modules/matricula/components/HistorialAsignaturasEstudiante/HistorialAsignaturasEstudiante.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  const document = (estado = 'POR_REVISAR') => ({
    idTipoDocumentoTramite: 5, codigoTipoDocumentoTramite: 'ANX-1', nombreTipoDocumentoTramite: 'Certificado', obligatorioTipoDocumentoTramite: true,
    documentoCargado: Boolean(estado), documentoUploadedResponse: estado ? {
      idDocumento: 50, nombreArchivoDocumento: 'certificado.pdf', estadoDocumento: estado,
      base64DocumentoContenido: 'JVBERi0=', mimeTypeDocumentoContenido: 'application/pdf',
    } : null,
  })
  let matricula, documents, missing, fetchError, decisionError, finalizationError, approvalError, validationError, decisions, approvals, finalized, savedSubjects
  let historial, historialError
  let consultasMatricula
  const ok = data => Response.json({ ok: true, data })
  t.beforeEach(() => {
    matricula = { id: 24, estudianteId: 17, estudianteNombreCompleto: 'Persona de prueba', codigoEstudianteUis: '2026001', programaAcademico: 'Maestría', periodoAcademico: '2026-2', estado: 'PENDIENTE_DOCUMENTOS', fechaSolicitud: '2026-10-17T10:00:00', asignaturas: [{ id: 33, asignaturaId: 7, asignaturaCodigo: 'UIS-7', asignaturaNombre: 'Investigación', estado: 'PENDIENTE', observaciones: null }] }
    documents = [document()]; missing = false; fetchError = false; decisionError = false; finalizationError = false; approvalError = false; validationError = false
    decisions = []; approvals = 0; finalized = 0; savedSubjects = []
    historial = []; historialError = false
    consultasMatricula = 0
    ui.response((url, init) => {
      const path = new URL(url, 'https://example.test').pathname
      if (path.endsWith('/matriculaAcademica/estudiante/17/historialAsignaturas')) {
        return historialError ? Response.json({ ok: false, message: 'Historial no disponible' }, { status: 503 }) : ok(historial)
      }
      if (path.endsWith('/matriculaAcademica')) {
        consultasMatricula++
        return fetchError ? Response.json({ message: 'Detalle no disponible' }, { status: 503 }) : ok(missing ? [] : [matricula])
      }
      if (path.includes('/matriculaAcademica/24/inclusionCancelacion/')) {
        const id = Number(path.split('/').at(-1))
        const body = JSON.parse(init.body)
        const asignaturas = matricula.asignaturas.map(item => item.id === id
          ? { ...item, estado: body.aprobado ? 'MATRICULADA' : 'INCLUSION_RECHAZADA', observaciones: body.observaciones }
          : item)
        matricula = { ...matricula, asignaturas, estado: asignaturas.some(item => item.estado === 'INCLUSION_SOLICITADA')
          ? 'INCLUSION_POR_VALIDAR' : 'FINALIZADA' }
        return ok(matricula)
      }
      if (path.endsWith('/document')) {
        if (init.method === 'PUT') {
          if (decisionError) return Response.json({ message: 'Decisión no guardada' }, { status: 503 })
          const body = JSON.parse(init.body)
          decisions.push(body)
          documents = documents.map(item => ({ ...item, documentoUploadedResponse: { ...item.documentoUploadedResponse, estadoDocumento: body.aprobado ? 'APROBADO' : 'RECHAZADO', observacionesDocumento: body.observaciones } }))
          return ok(null)
        }
        return ok(documents)
      }
      if (path.endsWith('/matriculaAcademica/24/finalizarRevisionDocumentos')) {
        finalized++
        return finalizationError ? Response.json({ message: 'Notificación no disponible' }, { status: 503 }) : new Response(null, { status: 204 })
      }
      if (path.endsWith('/matriculaAcademica/24/validarAsignaturas')) {
        if (validationError) return Response.json({ message: 'Validación no guardada' }, { status: 503 })
        const body = JSON.parse(init.body)
        savedSubjects.push(body)
        matricula = { ...matricula, asignaturas: matricula.asignaturas.map(item => ({ ...item, estado: body.asignaturas[0].estado, observaciones: body.asignaturas[0].observaciones })) }
        return ok(null)
      }
      if (path.endsWith('/matriculaAcademica/24')) {
        approvals++
        if (approvalError) return Response.json({ message: 'Matrícula no aprobada' }, { status: 503 })
        matricula = { ...matricula, estado: 'RADICADA' }
        return ok(null)
      }
      throw new Error(`Petición inesperada: ${url}`)
    })
  })
  const mount = (s, { id = '24', roles = ['COORDINADOR'] } = {}) => {
    s.after(ui.cleanup)
    const user = { id: 10, username: 'persona', nombreCompleto: 'Persona de prueba', roles }
    return ui.render(createElement(MemoryRouter, { initialEntries: [`/matricula/academica/${id}`] },
      createElement(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } },
        createElement(Routes, null,
          createElement(Route, { path: '/matricula/academica/:matriculaId', element: createElement(Page) }),
          createElement(Route, { path: '/matricula/academica', element: createElement('h1', null, 'Listado de matrícula académica') })))))
  }
  const ready = async view => { await view.findByRole('heading', { name: 'Asignaturas registradas' }) }
  const approveDoc = view => ui.fireEvent.click(view.getAllByRole('button', { name: 'Aprobar' })[0])

  await t.test('volver desde el detalle abre el listado de matrícula académica', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('link', { name: 'Volver al listado' }))
    await view.findByRole('heading', { name: 'Listado de matrícula académica' })
  })

  await t.test('el detalle muestra el último resultado de cada materia en todos sus periodos', async s => {
    const base = {
      matriculaId: 24, periodoAcademico: '2026 - 2', asignaturaId: 7, asignaturaCodigo: '456',
      asignaturaNombre: 'Interna 1', estadoAnterior: null, estadoNuevo: 'SELECCIONADA',
      fecha: '2026-10-17T09:00:00', responsable: 'Coordinación de prueba', detalle: 'Observación del historial',
    }
    historial = [
      { ...base, matriculaId: 12, periodoAcademico: '2026 - 1', estadoNuevo: 'MATRICULADA', fecha: '2026-05-09T09:00:00' },
      { ...base, estadoNuevo: 'NO_MATRICULADA', fecha: '2026-10-17T10:00:00' },
      { ...base, periodoAcademico: '2026-2' },
      { ...base, asignaturaId: 8, asignaturaCodigo: '123', asignaturaNombre: 'Externa' },
      { ...base, asignaturaId: 8, asignaturaCodigo: '123', asignaturaNombre: 'Externa', estadoNuevo: 'NO_MATRICULADA' },
      { ...base, asignaturaId: 9, asignaturaCodigo: '28220', asignaturaNombre: 'Propuesta de Tesis Doctoral I', estadoNuevo: 'MATRICULADA' },
    ]
    const view = mount(s)
    const actual = await view.findByRole('region', { name: 'Periodo 2026-2' })
    const anterior = view.getByRole('region', { name: 'Periodo 2026-1' })
    assert.deepEqual(view.getAllByRole('region', { name: /^Periodo 2026/ }), [actual, anterior])
    const verificarFilas = (periodo, filas) => {
      const items = ui.within(periodo).getAllByRole('listitem')
      assert.equal(items.length, filas.length)
      for (const [index, [materia, estado, variante]] of filas.entries()) {
        const fila = ui.within(items[index])
        assert.ok(fila.getByText(materia, { exact: true }))
        assert.ok(fila.getByText(estado, { exact: true }).classList.contains(`historial-asignaturas__resultado--${variante}`))
      }
    }
    verificarFilas(actual, [
      ['Externa (123)', 'No matriculada', 'rejected'],
      ['Interna 1 (456)', 'No matriculada', 'rejected'],
      ['Propuesta de Tesis Doctoral I (28220)', 'Matriculada', 'approved'],
    ])
    verificarFilas(anterior, [['Interna 1 (456)', 'Matriculada', 'approved']])
    assert.equal(view.queryByText('Coordinación de prueba'), null)
    assert.equal(view.queryByText('Observación del historial'), null)
  })

  await t.test('el detalle informa si el historial está vacío o la consulta falla', async s => {
    const vacio = mount(s)
    await vacio.findByText('No hay historial de materias registrado.')
    await ui.cleanup()
    historialError = true
    const fallido = mount(s)
    await fallido.findByText('Historial no disponible')
    assert.equal(fallido.queryAllByRole('region', { name: /^Periodo/ }).length, 0)
  })

  await t.test('la vista de cambios conserva los eventos individuales del historial', async s => {
    s.after(ui.cleanup)
    const fila = {
      matriculaId: 24, periodoAcademico: '2026-2', asignaturaId: 7, asignaturaCodigo: null,
      asignaturaNombre: 'Interna 1', estadoAnterior: null, estadoNuevo: 'SELECCIONADA',
      fecha: '2026-10-17T09:00:00', responsable: 'Coordinación de prueba', detalle: null,
    }
    historial = [fila, { ...fila, estadoAnterior: 'SELECCIONADA', estadoNuevo: 'MATRICULADA', fecha: '2026-10-17T10:00:00' }]
    const view = ui.render(createElement(Historial, { estudianteId: 17 }))
    const tabla = await view.findByRole('table')
    assert.equal(ui.within(tabla).getAllByText('Interna 1', { exact: true }).length, 2)
    assert.ok(ui.within(tabla).getByText('Seleccionada → Matriculada'))
  })

  await t.test('id inválido y matrícula inexistente muestran errores sin acciones', async s => {
    let view = mount(s, { id: 'invalido' })
    await view.findByText('La matrícula solicitada no es válida.')
    assert.equal(decisions.length, 0)
    await ui.cleanup()
    missing = true
    view = mount(s)
    await view.findByText('No se encontró la matrícula seleccionada.')
    assert.equal(view.queryAllByRole('button', { name: 'Guardar validación de asignaturas' }).length, 0)
    const enlaces = view.getAllByRole('link', { name: 'Volver al listado' })
    assert.equal(enlaces.length, 2)
    for (const enlace of enlaces) assert.equal(enlace.getAttribute('href'), '/matricula/academica')
    ui.fireEvent.click(enlaces[1])
    await view.findByRole('heading', { name: 'Listado de matrícula académica' })
  })

  await t.test('fallo del servidor no presenta controles de revisión utilizables', async s => {
    fetchError = true
    const view = mount(s)
    await view.findByText('Detalle no disponible')
    assert.equal(view.queryAllByRole('button', { name: 'Aprobar' }).length, 0)
  })

  await t.test('estudiante no tiene controles administrativos en este detalle', async s => {
    const view = mount(s, { roles: ['ESTUDIANTE'] })
    assert.ok(view.getByText('No disponible para tu rol.'))
    await ui.waitFor(() => assert.ok(ui.requests.length > 0))
    assert.equal(view.queryAllByRole('button', { name: 'Aprobar' }).length, 0)
    assert.equal(approvals, 0)
    assert.equal(decisions.length, 0)
  })

  await t.test('documento pendiente no puede abrirse ni aprobarse', async s => {
    documents = [document(null)]
    const view = mount(s)
    await ready(view)
    assert.equal(view.getByRole('button', { name: 'Ver' }).disabled, true)
    assert.equal(view.getByRole('button', { name: 'Descargar' }).disabled, true)
    assert.equal(view.getAllByRole('button', { name: 'Aprobar' })[0].disabled, true)
    assert.equal(finalized, 0)
  })

  await t.test('rechazo exige motivo, permite cancelar y envía texto recortado', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Rechazar' })[0])
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    assert.ok(view.getByText('Debe ingresar el motivo del rechazo.'))
    assert.equal(decisions.length, 0)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cancelar' }))
    assert.equal(view.queryAllByLabelText('Motivo del rechazo').length, 0)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Rechazar' })[0])
    ui.fireEvent.change(view.getByLabelText('Motivo del rechazo'), { target: { value: '  Certificado ilegible  ' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    await ui.waitFor(() => assert.equal(finalized, 1))
    assert.deepEqual(decisions, [{ documentoId: 50, aprobado: false, observaciones: 'Certificado ilegible' }])
    assert.equal(approvals, 0)
    assert.ok(view.getByText('RECHAZADO'))
  })

  await t.test('último obligatorio aprobado finaliza revisión y avanza matrícula una sola vez', async s => {
    const view = mount(s)
    await ready(view)
    approveDoc(view)
    await view.findByText('Todos los documentos obligatorios fueron aprobados. La matrícula avanzó correctamente.')
    assert.deepEqual(decisions, [{ documentoId: 50, aprobado: true, observaciones: null }])
    assert.equal(finalized, 1)
    assert.equal(approvals, 1)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cerrar notificación' }))
    assert.equal(view.queryAllByRole('button', { name: 'Cerrar notificación' }).length, 0)
  })

  await t.test('fallo de decisión conserva documento sin notificar ni aprobar matrícula', async s => {
    decisionError = true
    const view = mount(s)
    await ready(view)
    approveDoc(view)
    await view.findByText('Decisión no guardada')
    assert.equal(finalized, 0)
    assert.equal(approvals, 0)
    assert.equal(documents[0].documentoUploadedResponse.estadoDocumento, 'POR_REVISAR')
  })

  await t.test('fallo al notificar revisión conserva el rechazo ya guardado', async s => {
    finalizationError = true
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Rechazar' })[0])
    ui.fireEvent.change(view.getByLabelText('Motivo del rechazo'), { target: { value: 'Documento incompleto' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    await view.findByText(/La decisión se guardó, pero no fue posible notificar/)
    assert.equal(decisions.length, 1)
    assert.ok(view.getByText('RECHAZADO'))
    assert.equal(approvals, 0)
  })

  await t.test('error de avance automático no repite la aprobación durante rerender', async s => {
    documents = [document('APROBADO')]
    approvalError = true
    const view = mount(s)
    await view.findByText('Matrícula no aprobada')
    assert.equal(approvals, 1)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cerrar notificación' }))
    assert.equal(approvals, 1)
  })

  await t.test('validación de asignaturas exige una decisión y envía usuario e ids correctos', async s => {
    matricula.estado = 'RADICADA'
    documents = [document('APROBADO')]
    const view = mount(s)
    await ready(view)
    const fila = ui.within(view.getByRole('row', { name: /Investigación/ }))
    assert.ok(fila.getByText('Pendiente', { exact: true }).classList.contains('matricula-detalle__badge--pending'))
    assert.ok(view.getByRole('columnheader', { name: 'Validación coordinación' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar validación de asignaturas' }))
    await view.findByText('Debe seleccionar al menos una asignatura para aprobar o rechazar.')
    assert.equal(savedSubjects.length, 0)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Rechazar' }).at(-1))
    ui.fireEvent.change(view.getByPlaceholderText('Observaciones de validación'), { target: { value: '  No cumple prerrequisito  ' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar validación de asignaturas' }))
    await view.findByText('La validación de asignaturas fue guardada correctamente.')
    assert.ok(fila.getByText('No matriculada', { exact: true }).classList.contains('matricula-detalle__badge--rejected'))
    assert.deepEqual(savedSubjects, [{ usuarioRevisionId: 10, observaciones: 'Revision manual', asignaturas: [{ asignaturaId: 7, estado: 'NO_MATRICULADA', observaciones: 'No cumple prerrequisito' }] }])
  })

  await t.test('error al guardar asignaturas mantiene decisión para reintentar', async s => {
    matricula.estado = 'RADICADA'
    documents = [document('APROBADO')]
    validationError = true
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getAllByRole('button', { name: 'Aprobar' }).at(-1))
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar validación de asignaturas' }))
    await view.findByText('Validación no guardada')
    assert.ok(view.getByRole('button', { name: 'Aprobada' }))
    validationError = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Guardar validación de asignaturas' }))
    await ui.waitFor(() => assert.equal(savedSubjects.length, 1))
  })

  await t.test('finalizada muestra el estado y los comentarios guardados sin controles de validación', async s => {
    documents = [{ ...document('APROBADO'), nombreTipoDocumentoTramite: 'Certificado EPS', descripcionTipoDocumentoTramite: ' Certificado   Éps ' }]
    matricula = { ...matricula, estado: 'FINALIZADA', asignaturas: [
      { ...matricula.asignaturas[0], estado: 'MATRICULADA', observaciones: 'Validada por coordinación' },
      { id: 34, asignaturaId: 8, asignaturaNombre: 'Seminario', estado: 'INCLUSION_SOLICITADA', observaciones: null },
    ] }
    const view = mount(s)
    await ready(view)
    assert.equal(view.getAllByText('Certificado EPS', { exact: true }).length, 1)
    assert.equal(view.queryByText('Certificado Éps', { exact: true }), null)
    assert.equal(view.queryByText('Validación', { exact: true }), null)
    assert.ok(view.getByText('certificado.pdf', { exact: true }))
    const aprobacionInclusion = view.getByRole('button', { name: 'Aprobar', exact: true })
    assert.ok(ui.within(aprobacionInclusion.closest('tr')).getByText('Seminario'))
    assert.equal(view.queryAllByRole('button', { name: 'Guardar validación de asignaturas' }).length, 0)
    assert.equal(view.queryByRole('columnheader', { name: 'Validación coordinación' }), null)
    assert.equal(view.queryByPlaceholderText('Observaciones de validación'), null)
    const fila = ui.within(view.getByRole('row', { name: /Investigación/ }))
    assert.ok(fila.getByText('Matriculada', { exact: true }).classList.contains('matricula-detalle__badge--approved'))
    assert.ok(fila.getByText('Validada por coordinación'))
    assert.ok(view.getByText('Inclusión solicitada', { exact: true }).classList.contains('matricula-detalle__badge--review'))
  })

  await t.test('decide inclusiones por fila y muestra Finalizada tras la última decisión sin recargar detalle', async s => {
    matricula = { ...matricula, estado: 'INCLUSION_POR_VALIDAR', asignaturas: [
      { ...matricula.asignaturas[0], estado: 'INCLUSION_SOLICITADA' },
      { id: 34, asignaturaId: 8, asignaturaNombre: 'Seminario', estado: 'INCLUSION_SOLICITADA' },
    ] }
    const view = mount(s)
    await ready(view)
    const tabla = ui.within(view.getByRole('heading', { name: 'Solicitudes de inclusión y cancelación pendientes' }).parentElement)
    const fila = nombre => ui.within(tabla.getByRole('row', { name: new RegExp(nombre) }))
    ui.fireEvent.change(fila('Seminario').getByRole('textbox'), { target: { value: 'Revisar requisitos' } })
    ui.fireEvent.click(fila('Investigación').getByRole('button', { name: 'Aprobar' }))
    await view.findByText('Solicitud aprobada correctamente.')
    assert.ok(view.getByText('Inclusión por validar', { exact: true }))
    assert.equal(fila('Seminario').getByRole('textbox').value, 'Revisar requisitos')
    assert.equal(tabla.queryByRole('row', { name: /Investigación/ }), null)
    ui.fireEvent.click(fila('Seminario').getByRole('button', { name: 'Rechazar' }))
    await view.findByText('Solicitud rechazada correctamente.')
    assert.ok(view.getByText('Finalizada', { exact: true }))
    assert.equal(consultasMatricula, 1)
  })

  await t.test('abrir y descargar documento usa contenido y nombre del checklist', async sub => {
    documents = [{ ...document(), descripcionTipoDocumentoTramite: 'Debe incluir la fecha de afiliación' }]
    const opened = [], downloaded = []; const previous = ui.dom.window.open; const anchorClick = ui.dom.window.HTMLAnchorElement.prototype.click
    ui.dom.window.open = url => { opened.push(url); return null }; ui.dom.window.HTMLAnchorElement.prototype.click = function () { downloaded.push(this.download) }
    sub.after(() => { ui.dom.window.open = previous; ui.dom.window.HTMLAnchorElement.prototype.click = anchorClick })
    const view = mount(sub); await ready(view); ui.fireEvent.click(view.getByRole('button', { name: 'Ver', exact: true })); await ui.waitFor(() => assert.equal(opened.length, 1))
    assert.ok(view.getByText('Debe incluir la fecha de afiliación'))
    assert.ok(view.getByText('Validación', { exact: true }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Descargar', exact: true })); await ui.waitFor(() => assert.equal(downloaded.length, 1)); assert.equal(downloaded[0], 'certificado.pdf')
  })
})
