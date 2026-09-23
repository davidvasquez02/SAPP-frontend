import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_ESTADOS_SOLICITUD_CATALOG,
  getEstadoSolicitudCatalog,
  getEstadoSolicitudLabel,
  normalizeEstadoSolicitud,
  setEstadoSolicitudCatalog,
} from '../src/modules/solicitudes/utils/estadoSolicitud.ts'

const estadosTrabajoGrado = [
  [12, 'JUR_POR_DESIG', 'JURADO POR DESIGNAR'],
  [13, 'JUR_INVITADO', 'JURADO INVITADO'],
  [14, 'EN_EVALUACION', 'EN EVALUACIÓN'],
  [15, 'CONCEPTOS_REC', 'CONCEPTOS RECIBIDOS'],
  [16, 'EN_AJUSTES', 'EN AJUSTES DEL ESTUDIANTE'],
  [17, 'SUST_PROGRAMADA', 'SUSTENTACIÓN PROGRAMADA'],
  [18, 'SUSTENTADA', 'SUSTENTADA'],
  [19, 'APLAZADA', 'APLAZADA'],
  [20, 'NO_APROBADA', 'NO APROBADA'],
] as const

test('reconoce y presenta en mayúsculas los estados de proyectos de grado', () => {
  for (const [id, sigla, label] of estadosTrabajoGrado) {
    assert.equal(normalizeEstadoSolicitud(sigla), sigla)
    assert.equal(getEstadoSolicitudLabel(sigla), label)
    assert.deepEqual(
      DEFAULT_ESTADOS_SOLICITUD_CATALOG.find((estado) => estado.id === id),
      { id, sigla, label },
    )
  }
})

test('normaliza en mayúsculas los nombres entregados por el catálogo remoto', () => {
  setEstadoSolicitudCatalog([
    { id: 14, sigla: 'EN_EVALUACION', label: 'En evaluación' },
    { id: 16, sigla: 'EN_AJUSTES', label: 'En ajustes del estudiante' },
  ])

  assert.deepEqual(getEstadoSolicitudCatalog().map(({ label }) => label), [
    'EN EVALUACIÓN',
    'EN AJUSTES DEL ESTUDIANTE',
  ])
  assert.equal(getEstadoSolicitudLabel('EN_EVALUACION'), 'EN EVALUACIÓN')

  setEstadoSolicitudCatalog([])
})

test('reconoce el estado enviado a consejo por sigla y por nombre descriptivo', () => {
  assert.equal(normalizeEstadoSolicitud('ENVIADA_CONSEJO'), 'ENVIADA_CONSEJO')
  assert.equal(normalizeEstadoSolicitud('ENVIADA A CONSEJO'), 'ENVIADA_CONSEJO')
  assert.equal(getEstadoSolicitudLabel('ENVIADA_CONSEJO'), 'ENVIADA A CONSEJO ACADEMICO')
  assert.deepEqual(
    DEFAULT_ESTADOS_SOLICITUD_CATALOG.find((estado) => estado.id === 10),
    { id: 10, sigla: 'ENVIADA_CONSEJO', label: 'ENVIADA A CONSEJO ACADEMICO' },
  )
})
