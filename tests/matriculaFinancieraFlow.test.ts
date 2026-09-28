import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { etiquetaResumen, GUIA_COORDINACION, GUIA_ESTUDIANTE, puedeEjecutarAccion, puedePublicarProceso } from '../src/modules/matricula-financiera/flow.ts'

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

test('solo permite publicar cuando todas las liquidaciones están en un estado final', () => {
  assert.equal(puedePublicarProceso({ pendientes: 0, respondidas: 0 }), true)
  assert.equal(puedePublicarProceso({ pendientes: 1, respondidas: 0 }), false)
  assert.equal(puedePublicarProceso({ pendientes: 0, respondidas: 1 }), false)
  assert.equal(puedePublicarProceso({ pendientes: 2, respondidas: 3 }), false)
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
  assert.match(source, /<dt>Fecha del primer envío de solicitudes<\/dt><dd>{fechaColombia\(proceso\.fechaEnvioSolicitudes\)}<\/dd>/)
  assert.doesNotMatch(source, /<dt>Primer envío<\/dt>/)
  assert.match(source, /<dt>Fecha límite recepción respuestas<\/dt><dd>{fechaColombia\(proceso\.fechaLimiteRespuesta\)}<\/dd>/)
  assert.doesNotMatch(source, /<dt>Cierre<\/dt>/)
  assert.doesNotMatch(source, /<dt>Publicación<\/dt>/)

  const detailsStart = source.indexOf('<details className="mf-card">')
  const detailsEnd = source.indexOf('</details>', detailsStart)
  const editButton = source.indexOf('>Editar parámetros</button>', detailsStart)
  assert.ok(detailsStart >= 0 && editButton > detailsStart && editButton < detailsEnd)

  const trackingStart = source.indexOf('<section className="mf-card"><h2>Seguimiento y cierre</h2>')
  const trackingEnd = source.indexOf('</section>', trackingStart)
  const addButton = source.indexOf('>Agregar estudiante</button>', trackingStart)
  const addForm = source.indexOf('<AgregarEstudiante', trackingStart)
  assert.ok(trackingStart >= 0 && addButton > trackingStart && addButton < trackingEnd)
  assert.ok(addForm > addButton && addForm < trackingEnd)
})

test('destaca las consecuencias de guardar cambios en los parámetros', () => {
  const source = readFileSync(new URL('../src/pages/MatriculaFinanciera/ParametrosProcesoForm.tsx', import.meta.url), 'utf8')

  assert.match(source, /className="mf-parameter-warning" role="note"/)
  assert.match(source, /Consecuencias de guardar cambios/)
  assert.match(source, /Guardar recalcula las filas sin valor final manual\. Revisa los valores antes de exportar nuevamente\./)
})

test('presenta el tipo de estudiante sin invertir el valor recibido del servicio', () => {
  const processSource = readFileSync(new URL('../src/pages/MatriculaFinanciera/ProcesoLiquidacionPage.tsx', import.meta.url), 'utf8')
  const detailSource = readFileSync(new URL('../src/pages/MatriculaFinanciera/LiquidacionDetallePage.tsx', import.meta.url), 'utf8')
  const addSource = readFileSync(new URL('../src/pages/MatriculaFinanciera/AgregarEstudiante.tsx', import.meta.url), 'utf8')

  assert.match(processSource, /<td>{row\.tipoEstudiante}<\/td>/)
  assert.match(detailSource, /<dd>{fila\.tipoEstudiante}<\/dd>/)
  assert.match(detailSource, /VIGENTE indica que el estudiante ingresa a primer semestre\. NUEVO indica que cursa segundo semestre o uno posterior\./)
  assert.match(addSource, /<option value="VIGENTE">Vigente<\/option><option value="NUEVO">Nuevo<\/option>/)
  assert.doesNotMatch(processSource, /etiquetaTipoEstudiante/)
  assert.doesNotMatch(detailSource, /etiquetaTipoEstudiante/)
})

test('el detalle unitario explica de forma amable la conservación de correcciones', () => {
  const source = readFileSync(new URL('../src/pages/MatriculaFinanciera/LiquidacionDetallePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /Ingresa las correcciones necesarias y revisa los valores antes de guardar\./)
  assert.match(source, /Si cierras esta sección, tus cambios se conservarán\./)
  assert.doesNotMatch(source, /El cálculo definitivo siempre viene del servidor/)
})

test('aplica los textos y controles operativos del hallazgo de cierre', () => {
  const listSource = readFileSync(new URL('../src/pages/MatriculaFinanciera/MatriculaFinancieraPage.tsx', import.meta.url), 'utf8')
  const processSource = readFileSync(new URL('../src/pages/MatriculaFinanciera/ProcesoLiquidacionPage.tsx', import.meta.url), 'utf8')
  const detailSource = readFileSync(new URL('../src/pages/MatriculaFinanciera/LiquidacionDetallePage.tsx', import.meta.url), 'utf8')

  assert.match(listSource, /p\.resumen\.respondidas/)
  assert.match(listSource, /etiquetaResumen\('respondidas'\)/)
  assert.match(listSource, /etiquetaEstadoLiquidacion\(item\.estado\)/)
  assert.match(detailSource, /Motivo de exclusión del proceso de liquidación:/)
  assert.doesNotMatch(detailSource, /<p>Motivo de exclusión:/)
  assert.doesNotMatch(processSource, /disabled={!cierrePermitido}/)
  assert.match(processSource, /disabled={!proceso\.resumen\.liquidadas \|\| !publicacionPermitida \|\| !confirmado}/)
  assert.match(processSource, /Para publicar, lleva todas las liquidaciones a un estado final: Liquidada o No liquidar\./)
  assert.match(processSource, /Fecha límite de pago de las liquidaciones en el sistema de la universidad/)
  assert.match(processSource, /{proceso\.resumen\.liquidadas} liquidadas · {proceso\.resumen\.pendientes} pendientes · {proceso\.resumen\.respondidas} respondidas\.<\/p>/)
  assert.doesNotMatch(processSource, /{proceso\.resumen\.conAlertas} con alertas\./)
})

test('muestra la fecha límite de pago a coordinación y al estudiante', () => {
  const listSource = readFileSync(new URL('../src/pages/MatriculaFinanciera/MatriculaFinancieraPage.tsx', import.meta.url), 'utf8')
  const processSource = readFileSync(new URL('../src/pages/MatriculaFinanciera/ProcesoLiquidacionPage.tsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../src/pages/MatriculaFinanciera/MatriculaFinancieraPage.css', import.meta.url), 'utf8')

  assert.match(processSource, /<dt>Fecha límite de pago en el sistema de la universidad<\/dt><dd>{fechaColombia\(proceso\.fechaLimitePago\)}<\/dd>/)
  assert.match(listSource, /className="mf-payment-deadline"/)
  assert.match(listSource, /fechaColombia\(item\.proceso\.fechaLimitePago\)/)
  assert.match(styles, /\.mf-my \.mf-payment-deadline/)
  assert.match(styles, /background:color-mix\(in srgb,var\(--primary\),transparent 88%\)/)
})
