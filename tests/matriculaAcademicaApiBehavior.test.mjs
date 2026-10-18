import assert from 'node:assert/strict'
import test from 'node:test'
import { apiHarness } from './helpers/apiHarness.mjs'

test('matrícula académica: contratos de vigencia, asignaturas y operaciones', async t => {
  const api = await apiHarness(t)
  const service = await api.load('/src/modules/matricula/services/matriculaAcademicaService.ts')
  const matricula = { id: 4, periodoId: 7, fechaSolicitud: '2026-10-17T10:00:00', estado: 'RADICADA' }

  await t.test('asignaturas priorizan código UIS y mantienen código externo como respaldo', async () => {
    api.reply([
      { id: 1, nombre: 'Investigación', codigoUis: 'UIS-1', codigoExterno: 'EXT-1', nivel: 2, programaId: 8 },
      { id: 2, nombre: 'Seminario', codigoUis: null, codigoExterno: 'EXT-2', nivel: null, programaId: 8 },
    ])
    assert.deepEqual(await service.getAsignaturasPorPrograma(8), [
      { id: 1, nombre: 'Investigación', codigo: 'UIS-1', nivel: 2, programaId: 8 },
      { id: 2, nombre: 'Seminario', codigo: 'EXT-2', nivel: null, programaId: 8 },
    ])
    assert.equal(api.requests.at(-1).url, '/api/sapp/asignaturas?programaId=8')
  })

  await t.test('selecciona fechas de MATRÍCULA y devuelve null si no están habilitadas', async () => {
    api.reply([{ id: 1, tipoTramite: { nombre: 'ADMISION' } }, { id: 2, tipoTramite: { nombre: ' matricula ' } }])
    assert.equal((await service.getPeriodoMatriculaVigente()).id, 2)
    api.reply([])
    assert.equal(await service.getPeriodoMatriculaVigente(), null)
  })

  await t.test('matrícula vigente elige la más reciente sin alterar orden de servidor', async () => {
    api.reply([{ ...matricula, id: 1, fechaSolicitud: '2026-01-01' }, matricula])
    assert.equal((await service.getMatriculaVigenteByEstudiante(18)).id, 4)
    assert.equal(api.requests.at(-1).url, '/api/sapp/matriculaAcademica/vigente/estudiante/18')
    api.reply([])
    assert.equal(await service.getMatriculaVigenteByEstudiante(18), null)
    api.reply([matricula])
    assert.deepEqual(await service.getMatriculasAcademicas(), [matricula])
  })

  await t.test('distingue matrícula existente, permiso de creación y ausencia de periodo', async () => {
    for (const data of [[matricula], matricula]) {
      api.reply(data)
      const result = await service.getMatriculaVigenteValidationByEstudiante(18)
      assert.equal(result.status, 'EXISTS')
      assert.deepEqual(result.matricula, matricula)
    }
    api.reply({ puedeCrear: true, periodoId: 7 }, { message: 'Periodo habilitado' })
    assert.deepEqual(await service.getMatriculaVigenteValidationByEstudiante(18), { status: 'CAN_CREATE', periodoId: 7, message: 'Periodo habilitado' })
    for (const data of [false, 'false', { puedeCrear: false, periodoId: 7 }]) {
      api.reply(data)
      assert.equal((await service.getMatriculaVigenteValidationByEstudiante(18)).status, 'NO_ACTIVE_PERIOD')
    }
  })

  await t.test('rechaza respuestas ambiguas para evitar crear matrícula sin periodo', async () => {
    for (const [data, message] of [
      [[], /no contiene datos válidos/], [true, /periodo requerido/], ['true', /periodo requerido/],
      [{ puedeCrear: true }, /periodo válido/], [{ puedeCrear: true, periodoId: '7' }, /periodo válido/],
      [null, /Formato de respuesta no soportado/], ['desconocido', /Formato de respuesta no soportado/],
    ]) {
      api.reply(data)
      await assert.rejects(service.getMatriculaVigenteValidationByEstudiante(18), message)
    }
  })

  await t.test('crear, aprobar y validar envían datos y rutas de la matrícula correcta', async () => {
    api.reply(null)
    const payload = { estudianteId: 18, periodoId: 7, asignaturaIds: [1, 2] }
    await service.crearMatriculaAcademica(payload)
    assert.equal(api.requests.at(-1).init.method, 'POST')
    assert.deepEqual(JSON.parse(api.requests.at(-1).init.body), payload)
    await service.aprobarMatriculaAcademica(4)
    assert.equal(api.requests.at(-1).init.method, 'PUT')
    assert.equal(api.requests.at(-1).url, '/api/sapp/matriculaAcademica/4')
    const validation = { asignaturas: [{ asignaturaId: 1, aprobada: true }] }
    await service.validarAsignaturasMatriculaAcademica(4, validation)
    assert.equal(api.requests.at(-1).url, '/api/sapp/matriculaAcademica/4/validarAsignaturas')
    assert.deepEqual(JSON.parse(api.requests.at(-1).init.body), validation)
  })

  await t.test('notificaciones admiten respuesta JSON y 204 sin intentar leer datos vacíos', async () => {
    for (const fn of [service.notificarAperturaMatricula, service.notificarDocumentosCompletosMatricula, service.finalizarRevisionDocumentosMatricula]) {
      api.reply(null, { message: 'Enviada' })
      const result = await fn(7)
      if (fn === service.notificarAperturaMatricula) assert.equal(result, 'Enviada')
      assert.equal(api.requests.at(-1).init.method, 'POST')
      api.response(() => new Response(null, { status: 204 }))
      await fn(7)
    }
    api.reply([])
    assert.deepEqual(await service.getDocumentosMatriculaAcademica(4), [])
    const url = new URL(api.requests.at(-1).url, 'https://example.test')
    assert.equal(url.searchParams.get('tramiteId'), '4')
    assert.ok(url.searchParams.has('codigoTipoTramite'))
  })

  await t.test('las operaciones no convierten ok:false del servidor en éxito', async () => {
    for (const invoke of [
      () => service.getAsignaturasPorPrograma(8), () => service.getMatriculasAcademicas(),
      () => service.getPeriodoMatriculaVigente(), () => service.getMatriculaVigenteByEstudiante(18),
      () => service.getMatriculaVigenteValidationByEstudiante(18), () => service.crearMatriculaAcademica({}),
      () => service.aprobarMatriculaAcademica(4), () => service.validarAsignaturasMatriculaAcademica(4, {}),
      () => service.notificarAperturaMatricula(7), () => service.notificarDocumentosCompletosMatricula(4),
      () => service.finalizarRevisionDocumentosMatricula(4),
    ]) {
      api.reply(null, { ok: false, message: 'Fuera del calendario académico' })
      await assert.rejects(invoke(), /Fuera del calendario académico/)
      api.reply(null, { ok: false })
      await assert.rejects(invoke(), /No fue posible/)
    }
  })
})
