import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('detalle de solicitud React: propiedad, decisiones, actas y firma', async t => {
  const ui = await reactApiHarness(t)
  const { default: Page } = await ui.load('/src/pages/SolicitudDetalle/SolicitudDetallePage.tsx')
  const { AuthContext } = await ui.load('/src/context/Auth/context.ts')
  let solicitud, own, detailFailure, historyFailure, docsFailure, actasFailure, changeFailure, signFailure, refreshFailureAfterSign, changes, signatures, historyCalls, enviosAComite
  let historialSolicitud
  const ok = data => Response.json({ ok: true, data })
  t.beforeEach(() => {
    solicitud = { id: 24, estudianteId: 18, estudiante: 'Persona de prueba', codigoEstudianteUis: '2026001', programaAcademico: 'Maestría', tipoSolicitudId: 99, tipoSolicitudCodigo: 'GENERAL', tipoSolicitud: 'Solicitud general', tipoTramiteCodigo: '100', estadoId: 1, estadoSigla: 'ENVIADA', estado: 'ENVIADA A COMITE', fechaRegistro: '2026-10-17', fechaResolucion: null, observaciones: 'Detalle de prueba' }
    own = true; detailFailure = false; historyFailure = false; docsFailure = false; actasFailure = false; changeFailure = false; signFailure = false; refreshFailureAfterSign = false
    changes = []; signatures = 0; historyCalls = 0; enviosAComite = 0
    historialSolicitud = [{ estadoNuevoSigla: 'ENVIADA', estadoNuevo: 'Enviada', fecha: '2026-10-17T10:30:00', responsable: 'Secretaría', detalle: 'Registro inicial' }]
    ui.response((url, init) => {
      const parsed = new URL(url, 'https://example.test')
      const path = parsed.pathname
      if (path.endsWith('/solicitudesAcademicas/estudiante')) return ok(own ? [solicitud] : [])
      if (path.endsWith('/solicitudesAcademicas/asignadas')) return ok([])
      if (path.endsWith('/solicitudesAcademicas/24/historial')) return historyFailure
        ? Response.json({ message: 'Historial no disponible' }, { status: 503 })
        : ok(historialSolicitud)
      if (path.endsWith('/solicitudesAcademicas/cambioEstado/24')) {
        if (changeFailure) return Response.json({ message: 'Transición rechazada' }, { status: 409 })
        changes.push(Object.fromEntries(parsed.searchParams))
        solicitud = { ...solicitud, estadoSigla: parsed.searchParams.get('siglaEstado'), estado: parsed.searchParams.get('siglaEstado'), motivoRechazo: parsed.searchParams.get('observaciones') }
        return ok(null)
      }
      if (path.endsWith('/solicitudesAcademicas/24/enviarAComite')) {
        enviosAComite++
        solicitud = { ...solicitud, estadoSigla: 'ENVIADA', estado: 'ENVIADA' }
        return ok(null)
      }
      if (path.endsWith('/firmasDocumento/solicitudesAcademicas/24')) {
        if (signFailure) return Response.json({ message: 'Firma no disponible' }, { status: 503 })
        signatures++
        solicitud = { ...solicitud, solicitudCreditoCondonable: { ...solicitud.solicitudCreditoCondonable, personaAsignadaId: 999 } }
        return ok(null)
      }
      if (path.endsWith('/solicitudesAcademicas/24')) return detailFailure || (refreshFailureAfterSign && signatures)
        ? Response.json({ message: 'Detalle no disponible' }, { status: 503 }) : ok(solicitud)
      if (path.endsWith('/document')) return docsFailure ? Response.json({ message: 'Adjuntos no disponibles' }, { status: 503 }) : ok([])
      if (path.endsWith('/actas')) return actasFailure ? Response.json({ message: 'Actas no disponibles' }, { status: 503 }) : ok([
        { id: 8, codigo: 'ACT-COMITE', nombre: 'Acta comité', fechaCreacion: '2026-10-01', tipoConsejo: false },
        { id: 9, codigo: 'ACT-CONSEJO', nombre: 'Acta consejo', fechaCreacion: '2026-10-02', tipoConsejo: true },
      ])
      if (path.endsWith('/homologaciones/historial')) { historyCalls++; return ok([{ id: 1, asignaturaOrigenCodigo: 'EXT-1', asignaturaOrigenNombre: 'Investigación externa', asignaturaDestinoCodigo: 'UIS-1', asignaturaDestinoNombre: 'Seminario', fechaHomologacion: '2026-10-01', activa: true, actaCodigo: 'ACT-1' }]) }
      throw new Error(`Petición inesperada: ${url} ${init.method}`)
    })
  })
  const tree = (roles, estudianteId = 18, id = '24') => {
    const user = { id: 10, username: 'persona', nombreCompleto: 'Persona de prueba', roles, persona: { id: 10 }, estudiante: { id: estudianteId }, detalle: { estudiante: { id: estudianteId } } }
    return createElement(MemoryRouter, { initialEntries: [`/solicitudes/${id}`] },
      createElement(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } },
        createElement(Routes, null, createElement(Route, { path: '/solicitudes/:solicitudId', element: createElement(Page) }))))
  }
  const mount = (s, roles = ['COORDINADOR'], id = '24') => { s.after(ui.cleanup); return ui.render(tree(roles, 18, id)) }
  const CrearReintentoDestinoProbe = () => createElement('div', { 'data-testid': 'crear-reintento-destino' }, JSON.stringify(useLocation().state))
  const mountConDestinoReintento = (s, roles, estudianteId = 18, id = '24') => {
    s.after(ui.cleanup)
    const user = { id: 10, username: 'persona', nombreCompleto: 'Persona de prueba', roles, persona: { id: 10 }, estudiante: { id: estudianteId }, detalle: { estudiante: { id: estudianteId } } }
    return ui.render(createElement(MemoryRouter, { initialEntries: [`/solicitudes/${id}`] },
      createElement(AuthContext.Provider, { value: { session: { kind: 'SAPP', user }, user } },
        createElement(Routes, null,
          createElement(Route, { path: '/solicitudes/:solicitudId', element: createElement(Page) }),
          createElement(Route, { path: '/proyectos-investigacion', element: createElement(CrearReintentoDestinoProbe) }),
        ))))
  }
  const ready = async view => { await view.findByRole('heading', { name: solicitud.tipoSolicitud, level: 2 }) }
  const signatureState = () => {
    solicitud = { ...solicitud, estadoSigla: 'PFIR_COOR_POS', estado: 'POR FIRMA', solicitudCreditoCondonable: { personaAsignadaId: 10 } }
  }

  await t.test('la ficha general agrupa los datos del estudiante y conserva programa y fechas', async s => {
    solicitud.programaAcademico = '347 - Doctorado - Sistemas'
    const view = mount(s)
    await ready(view)
    assert.ok(view.getByText('Solicitud general · Solicitud 24'))
    const datos = view.getByLabelText('Datos generales')
    assert.match(datos.querySelector('dd').textContent, /Persona de Prueba.*Código 2026001/i)
    assert.equal(view.getByText(solicitud.programaAcademico).tagName, 'DD')
    assert.equal(view.getByText('Fecha de registro').nextElementSibling.textContent, '17/10/2026')
    assert.equal(view.getByText('Fecha de resolución').nextElementSibling.textContent, '—')
    assert.equal(datos.querySelector('.status-badge'), null)
    assert.ok(view.getByRole('heading', { name: 'Información de la solicitud' }))
    assert.equal(view.queryByText('Resumen'), null)
  })

  await t.test('crédito rechazado muestra todos los motivos y distingue el rechazo de las observaciones', async s => {
    Object.assign(solicitud, { tipoSolicitudCodigo: 'CRED_COND', estadoSigla: 'RECHAZADA',
      motivosCreditoCondonable: ['Motivo académico', 'Motivo económico'], motivoRechazo: 'Falta soporte' })
    const view = mount(s, ['ESTUDIANTE'])
    const ficha = await view.findByRole('region', { name: 'Información del crédito condonable' })
    assert.ok(view.getByText('Crédito condonable · Solicitud 24'))
    assert.deepEqual([...ficha.querySelectorAll('li')].map(item => item.textContent), solicitud.motivosCreditoCondonable)
    assert.equal(view.getByText('Motivo de rechazo').nextElementSibling.textContent, 'Falta soporte')
    assert.equal(view.queryByText('Detalle de prueba'), null)
  })

  await t.test('candidatura conserva el título y omite el resumen según el tipo', async s => {
    Object.assign(solicitud, { tipoSolicitudCodigo: 'CAND_DOCTORAL', tituloTrabajo: 'Proyecto de prueba', resumenTrabajo: 'Resumen reservado' })
    const view = mount(s)
    await view.findByRole('region', { name: 'Información del proyecto' })
    assert.ok(view.getByText('Proyecto de grado · Solicitud 24'))
    assert.ok(view.getByText('Proyecto de prueba'))
    assert.equal(view.queryByText('Resumen reservado'), null)
  })

  for (const [estadoSigla, comite, consejo] of [
    ['EN_VALIDACION_COORDINACION', false, false], ['ENVIADA', false, false],
    ['ENVIADA_CONSEJO', true, false], ['JUR_POR_DESIG', true, true], ['EN_EVALUACION', true, true],
  ]) {
    await t.test(`el estudiante ve las referencias registradas que corresponden a ${estadoSigla}`, async s => {
      Object.assign(solicitud, { estadoSigla, tipoSolicitudCodigo: 'PROP_TI_MISI' })
      historialSolicitud = [
        ['JUR_POR_DESIG', '05', 'Observaciones: Referencia: Primera línea\nSegunda línea'],
        ['ENVIADA_CONSEJO', '04', 'Observaciones: Referencia: Acta 4'],
        ['ENVIADA_CONSEJO', '03', 'Observaciones: Referencia: Acta previa'],
        ['ENVIADA_CONSEJO', '06', 'Observaciones: Otro movimiento'],
      ].map(([sigla, minuto, detalle]) => ({ estadoNuevoSigla: sigla, estadoNuevo: sigla, fecha: `2026-11-17T16:${minuto}:00`, detalle, responsable: 'Coordinación' }))
      const view = mount(s, ['ESTUDIANTE'])
      await view.findByText('Observaciones: Otro movimiento')
      const ficha = ui.within(view.getByRole('region', { name: 'Información del proyecto' }))
      assert.equal(ficha.queryByText('Referencia del comité')?.nextElementSibling.textContent, comite ? 'Acta 4' : undefined)
      assert.equal(ficha.queryByText('Decisión del consejo')?.nextElementSibling.textContent, consejo ? 'Primera línea\nSegunda línea' : undefined)
    })
  }

  await t.test('id inválido y fallo de consulta no muestran el detalle', async s => {
    let view = mount(s, ['COORDINADOR'], 'invalido')
    await view.findByText('ID inválido')
    await ui.cleanup()
    detailFailure = true
    view = mount(s)
    await view.findByText('Detalle no disponible')
    assert.equal(view.queryAllByRole('heading', { name: solicitud.tipoSolicitud, level: 2 }).length, 0)
  })

  await t.test('estudiante solo ve solicitudes devueltas por su consulta personal', async s => {
    own = false
    const start = ui.requests.length
    const view = mount(s, ['ESTUDIANTE'])
    await view.findByText('No tienes permiso para consultar esta solicitud.')
    assert.equal(ui.requests.slice(start).some(item => new URL(item.url, 'https://example.test').pathname.endsWith('/solicitudesAcademicas/24')), false)
    assert.equal(view.queryAllByText('Detalle de prueba').length, 0)
  })

  await t.test('cambiar estudiante en sesión limpia el detalle anterior y revalida propiedad', async s => {
    const view = mount(s, ['ESTUDIANTE'])
    await ready(view)
    assert.ok(view.getByText('Detalle de prueba'))
    own = false
    view.rerender(tree(['ESTUDIANTE'], 19))
    await view.findByText('No tienes permiso para consultar esta solicitud.')
    assert.equal(view.queryAllByText('Detalle de prueba').length, 0)
    assert.ok(ui.requests.some(item => item.url.includes('estudianteId=19')))
  })

  await t.test('historial fallido no oculta solicitud y adjuntos admiten reintento', async s => {
    historyFailure = true; docsFailure = true
    const view = mount(s)
    await ready(view)
    await view.findByText('Historial no disponible')
    await view.findByText('Adjuntos no disponibles')
    docsFailure = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Reintentar' }))
    await view.findByText('No hay documentos adjuntos.')
    assert.ok(view.getByText('Detalle de prueba'))
  })

  await t.test('rechazo exige motivo y conserva su texto en el detalle actualizado', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Rechazar' }))
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    assert.ok(view.getByText('Debes indicar el motivo del rechazo.'))
    assert.equal(changes.length, 0)
    ui.fireEvent.change(view.getByLabelText(/Motivo \*/), { target: { value: '  Soporte incompleto & sin firma  ' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    await view.findByText('Estado actualizado correctamente')
    assert.deepEqual(changes, [{ siglaEstado: 'RECHAZADA', observaciones: 'Soporte incompleto & sin firma' }])
    assert.ok(view.getByText('Soporte incompleto & sin firma'))
  })

  await t.test('si el detalle falla tras enviar a comité permite reconsultar sin repetir el envío', async s => {
    Object.assign(solicitud, { tipoSolicitudCodigo: 'PROP_TESIS_DCC', estadoSigla: 'EN_VALIDACION_COORDINACION', estado: 'EN VALIDACION DE COORDINACION' })
    const view = mount(s)
    await ready(view)
    detailFailure = true
    ui.fireEvent.click(view.getByRole('button', { name: 'Enviar a comité' }))
    const actualizar = await view.findByRole('button', { name: 'Actualizar detalle' })
    assert.equal(view.queryByRole('button', { name: 'Enviar a comité' }), null)
    detailFailure = false
    historyFailure = true
    ui.fireEvent.click(actualizar)
    await view.findByText('Historial no disponible')
    historyFailure = false
    ui.fireEvent.click(view.getByRole('button', { name: 'Actualizar histórico' }))
    await view.findByText('Registro inicial')
    assert.equal(enviosAComite, 1)
    assert.equal(view.queryByRole('button', { name: 'Actualizar detalle' }), null)
  })

  await t.test('aprobación desde comité exige acta y excluye las de Consejo', async s => {
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar' }))
    const select = await view.findByRole('combobox')
    assert.deepEqual([...select.options].map(option => option.value), ['', '8'])
    assert.equal(view.getByRole('button', { name: 'Aprobar con acta' }).disabled, true)
    ui.fireEvent.change(select, { target: { value: '8' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar con acta' }))
    await view.findByText('Estado actualizado correctamente')
    assert.deepEqual(changes, [{ siglaEstado: 'APROBADA', actaId: '8' }])
  })

  await t.test('solicitud en Consejo solo ofrece actas de Consejo', async s => {
    solicitud = { ...solicitud, estadoSigla: 'ENVIADA_CONSEJO', estado: 'ENVIADA A CONSEJO' }
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar' }))
    const select = await view.findByRole('combobox')
    assert.deepEqual([...select.options].map(option => option.value), ['', '9'])
    ui.fireEvent.change(select, { target: { value: '9' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar con acta' }))
    await view.findByText('Estado actualizado correctamente')
    assert.equal(changes[0].actaId, '9')
  })

  await t.test('actas no disponibles bloquean aprobación y permiten cancelar', async s => {
    actasFailure = true
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar' }))
    await view.findByText('Actas no disponibles')
    assert.equal(view.getByRole('button', { name: 'Aprobar con acta' }).disabled, true)
    ui.fireEvent.click(view.getByRole('button', { name: 'Cancelar' }))
    assert.equal(changes.length, 0)
  })

  await t.test('transición rechazada por servidor conserva estado y permite reintentar', async s => {
    changeFailure = true
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Rechazar' }))
    ui.fireEvent.change(view.getByLabelText(/Motivo \*/), { target: { value: 'Documento incompleto' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Confirmar rechazo' }))
    await view.findByText('Transición rechazada')
    assert.equal(changes.length, 0)
    assert.ok(view.getByRole('button', { name: 'Rechazar' }))
  })

  await t.test('firma exitosa actualiza documentos y retira acción de la asignación consumida', async s => {
    signatureState()
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(await view.findByRole('button', { name: 'Firmar documentos' }))
    await view.findByText('Se firmaron únicamente los documentos que requieren tu firma y la información fue actualizada correctamente.')
    assert.equal(signatures, 1)
    assert.equal(view.queryAllByRole('button', { name: 'Firmar documentos' }).length, 0)
  })

  await t.test('firma ya realizada no se repite aunque falle recarga del detalle', async s => {
    signatureState(); refreshFailureAfterSign = true
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(await view.findByRole('button', { name: 'Firmar documentos' }))
    await view.findByText('Detalle no disponible')
    assert.equal(signatures, 1)
    assert.equal(view.queryAllByRole('button', { name: 'Firmar documentos' }).length, 0)
  })

  await t.test('fallo de firma permite reintentar; persona distinta nunca recibe acción', async s => {
    signatureState(); signFailure = true
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(await view.findByRole('button', { name: 'Firmar documentos' }))
    await view.findByText('Firma no disponible')
    assert.ok(view.getByRole('button', { name: 'Firmar documentos' }))
    assert.equal(signatures, 0)
    await ui.cleanup()
    solicitud = { ...solicitud, solicitudCreditoCondonable: { personaAsignadaId: 999 } }
    const other = mount(s)
    await ready(other)
    assert.equal(other.queryAllByRole('button', { name: 'Firmar documentos' }).length, 0)
  })

  await t.test('homologación consulta antecedentes una sola vez y permite cerrar historial', async sub => {
    solicitud = { ...solicitud, tipoSolicitudCodigo: 'HOMOLOG', solicitudHomologacionesAsignaturas: [{ id: 2, asignaturaOrigenNombre: 'Origen sintético', asignaturaDestinoNombre: 'Destino sintético' }] }
    const view = mount(sub); await ready(view); ui.fireEvent.click(view.getByRole('button', { name: 'Ver historial de homologaciones' })); await view.findByText('Investigación externa')
    ui.fireEvent.click(view.getByRole('button', { name: 'Ocultar historial' })); ui.fireEvent.click(view.getByRole('button', { name: 'Ver historial de homologaciones' })); await view.findByText('Investigación externa'); assert.equal(historyCalls, 1)
  })
  for (const consejo of [true, false]) await t.test(`solicitud OTRA confirma destino Consejo=${consejo} antes de asociar acta`, async sub => {
    solicitud = { ...solicitud, tipoSolicitudCodigo: 'OTRA', tipoSolicitudId: 11 }
    const view = mount(sub); await ready(view); ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar' })); await view.findByText('¿Requiere aprobación del Consejo Académico?')
    ui.fireEvent.click(view.getByRole('button', { name: consejo ? 'Sí, enviar al Consejo' : 'No, aprobar directamente' })); const select = await view.findByRole('combobox'); ui.fireEvent.change(select, { target: { value: '8' } }); ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar con acta' })); await view.findByText('Estado actualizado correctamente'); assert.equal(changes[0].enviarConsejo, String(consejo))
  })

  await t.test('trabajo de grado aplazado deja al estudiante crear un reintento enlazado', async s => {
    solicitud = { ...solicitud, estadoSigla: 'APLAZADA', estado: 'APLAZADA', tipoSolicitudCodigo: 'DEF_TI_MISI', tipoSolicitudId: 6, tituloTrabajo: 'Tesis original', resumenTrabajo: 'Resumen original' }
    const view = mountConDestinoReintento(s, ['ESTUDIANTE'])
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Crear reintento' }))
    const destino = JSON.parse((await view.findByTestId('crear-reintento-destino')).textContent)
    assert.equal(destino.solicitudBaseId, 24)
    assert.equal(destino.tipoSolicitudId, 6)
    assert.equal(destino.tituloTrabajo, 'Tesis original')
    assert.equal(destino.resumenTrabajo, 'Resumen original')
  })

  await t.test('coordinador envia a comite una solicitud en validacion de coordinacion y el estudiante nunca ve esa accion', async s => {
    solicitud = { ...solicitud, estadoSigla: 'EN_VALIDACION_COORDINACION', estado: 'EN_VALIDACION_COORDINACION' }
    const view = mount(s, ['COORDINADOR'])
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Enviar a comité' }))
    await view.findByText('Solicitud enviada al comité asesor')
    assert.equal(enviosAComite, 1)
    await ui.cleanup()
    solicitud = { ...solicitud, estadoSigla: 'EN_VALIDACION_COORDINACION', estado: 'EN_VALIDACION_COORDINACION' }
    const estudiante = mount(s, ['ESTUDIANTE'])
    await ready(estudiante)
    assert.equal(estudiante.queryAllByRole('button', { name: 'Enviar a comité' }).length, 0)
  })

  await t.test('el botón de enviar a comité no aparece fuera de validación de coordinación', async s => {
    const view = mount(s, ['COORDINADOR'])
    await ready(view)
    assert.equal(view.queryAllByRole('button', { name: 'Enviar a comité' }).length, 0)
  })

  await t.test('el botón de crear reintento no aparece fuera de APLAZADA ni para el coordinador', async s => {
    solicitud = { ...solicitud, estadoSigla: 'APLAZADA', tipoSolicitudCodigo: 'DEF_TI_MISI' }
    const asCoordinador = mount(s, ['COORDINADOR'])
    await ready(asCoordinador)
    assert.equal(asCoordinador.queryAllByRole('button', { name: 'Crear reintento' }).length, 0)
    await ui.cleanup()
    solicitud = { ...solicitud, estadoSigla: 'ENVIADA', estado: 'ENVIADA A COMITE' }
    const enviada = mount(s, ['ESTUDIANTE'])
    await ready(enviada)
    assert.equal(enviada.queryAllByRole('button', { name: 'Crear reintento' }).length, 0)
  })

  await t.test('ajuste #5: aprobar un trabajo de grado no exige acta, acepta una referencia libre opcional', async s => {
    solicitud = { ...solicitud, estadoSigla: 'ENVIADA', estado: 'ENVIADA A COMITE', tipoSolicitudId: 6, tipoSolicitudCodigo: 'DEF_TI_MISI' }
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar y enviar a consejo académico' }))
    assert.equal(view.queryAllByRole('combobox').length, 0)
    assert.equal(view.queryAllByText('Acta *').length, 0)
    const aprobar = await view.findByRole('button', { name: 'Aprobar' })
    assert.equal(aprobar.disabled, false)
    ui.fireEvent.click(aprobar)
    await view.findByText('Estado actualizado correctamente')
    assert.equal(changes[0].siglaEstado, 'APROBADA')
    assert.equal('referenciaActa' in changes[0], false)
    assert.equal('actaId' in changes[0], false)
  })

  await t.test('ajuste #5: la referencia escrita al aprobar un trabajo de grado llega al back', async s => {
    solicitud = { ...solicitud, estadoSigla: 'ENVIADA', estado: 'ENVIADA A COMITE', tipoSolicitudId: 6, tipoSolicitudCodigo: 'DEF_TI_MISI' }
    const view = mount(s)
    await ready(view)
    ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar y enviar a consejo académico' }))
    ui.fireEvent.change(await view.findByLabelText('Referencia (opcional)'), { target: { value: '  Sesión de comité del 5 de noviembre  ' } })
    ui.fireEvent.click(view.getByRole('button', { name: 'Aprobar' }))
    await view.findByText('Estado actualizado correctamente')
    assert.equal(changes[0].referenciaActa, 'Sesión de comité del 5 de noviembre')
  })
})
