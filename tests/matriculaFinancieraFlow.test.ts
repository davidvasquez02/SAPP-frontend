import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { etiquetaResumen, GUIA_COORDINACION, GUIA_ESTUDIANTE, puedeEjecutarAccion } from '../src/modules/matricula-financiera/flow.ts'

test('la guía explica el proceso completo para ambos perfiles', () => {
  assert.equal(GUIA_COORDINACION.length, 4)
  assert.equal(GUIA_ESTUDIANTE.length, 4)
  assert.match(GUIA_COORDINACION.at(-1)?.titulo ?? '', /Publica/)
  assert.match(GUIA_ESTUDIANTE.at(-1)?.descripcion ?? '', /total/)
})

test('el paso de espera estudiantil describe la liquidación sin atribuir una validación a coordinación', () => {
  assert.deepEqual(GUIA_ESTUDIANTE[2], {
    titulo: 'Espera la liquidación',
    descripcion: 'La coordinación recibe la información y realiza el proceso de liquidación.',
  })
})

test('el primer paso estudiantil pide verificar los datos de la liquidación', () => {
  assert.deepEqual(GUIA_ESTUDIANTE[0], {
    titulo: 'Revisa la solicitud',
    descripcion: 'Verifica los datos de tu liquidacion: el periodo academico, el programa academico, ten presente la fecha limite para llevar a cabo tu proceso.',
  })
})

test('solo permite acciones compatibles con el estado del proceso', () => {
  assert.equal(puedeEjecutarAccion('BORRADOR', 'convocar'), true)
  assert.equal(puedeEjecutarAccion('BORRADOR', 'publicar'), false)
  assert.equal(puedeEjecutarAccion('ABIERTO', 'cerrar'), true)
  assert.equal(puedeEjecutarAccion('CERRADO', 'publicar'), true)
  assert.equal(puedeEjecutarAccion('PUBLICADO', 'recalcular'), false)
})

test('presenta las métricas con etiquetas de negocio legibles', () => {
  assert.equal(etiquetaResumen('convocados'), 'Estudiantes registrados en el proceso de matrícula')
  assert.equal(etiquetaResumen('liquidadas'), 'Matrículas registradas en el sistema financiero (PUTTY)')
  assert.equal(etiquetaResumen('noLiquidar'), 'Estudiantes excluidos de liquidación')
  assert.equal(etiquetaResumen('pendientes'), 'Estudiantes pendientes de responder')
  assert.equal(etiquetaResumen('respondidas'), 'Estudiantes que registraron sus respuestas')
  assert.equal(etiquetaResumen('conAlertas'), 'Con alertas')
  assert.equal(etiquetaResumen('otra'), 'otra')
})

test('advierte el alcance y las consecuencias antes de convocar estudiantes', () => {
  const source = readFileSync(new URL('../src/pages/MatriculaFinanciera/ProcesoLiquidacionPage.tsx', import.meta.url), 'utf8')

  assert.match(source, /todos los estudiantes activos \(vigentes y nuevos\)/)
  assert.match(source, /antes de enviar las solicitudes/)
  assert.match(source, /se habilitará el proceso y se enviará correo/)
  assert.match(source, /role="note"/)
})

test('presenta los parámetros operativos solicitados en el tablero financiero', () => {
  const source = readFileSync(new URL('../src/pages/MatriculaFinanciera/ProcesoLiquidacionPage.tsx', import.meta.url), 'utf8')

  assert.match(source, /<dt>SMMLV<\/dt><dd>{money\(proceso\.valorSmmlv\)}<\/dd>/)
  assert.match(source, /<dt>Porcentaje de votación<\/dt><dd>{proceso\.porcentajeVotacion}%<\/dd>/)
  assert.match(source, /<dt>Porcentaje de salud<\/dt><dd>{proceso\.porcentajeSalud}%<\/dd>/)
  assert.doesNotMatch(source, /<dt>Votación \/ salud<\/dt>/)
  assert.match(source, /<dt>Fecha límite recepción respuestas<\/dt><dd>{fechaColombia\(proceso\.fechaLimiteRespuesta\)}<\/dd>/)
  assert.doesNotMatch(source, /<dt>Cierre<\/dt>/)
  assert.doesNotMatch(source, /<dt>Publicación<\/dt>/)

  const detailsStart = source.indexOf('<details className="mf-card">')
  const detailsEnd = source.indexOf('</details>', detailsStart)
  const editButton = source.indexOf('>Editar parámetros</button>', detailsStart)
  const addButton = source.indexOf('>Agregar estudiante</button>', detailsEnd)
  assert.ok(detailsStart >= 0 && editButton > detailsStart && editButton < detailsEnd)
  assert.ok(addButton > detailsEnd)
})
