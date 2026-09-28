import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const coordinacionCssPath = new URL(
  '../src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.css',
  import.meta.url,
)
const estudianteCssPath = new URL(
  '../src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionEstudiante.css',
  import.meta.url,
)

test('el proceso de coordinación responde al ancho real de su contenedor', async () => {
  const css = await readFile(coordinacionCssPath, 'utf8')

  assert.match(css, /\.evaluacion-tg \{ container-type: inline-size; min-width: 0;/)
  assert.match(css, /@container \(max-width: 700px\)/)
  assert.match(css, /\.evaluacion-tg__ready button \{ grid-column: 1 \/ -1; width: 100%; \}/)
  assert.match(css, /\.evaluacion-tg__actions \{ margin-top: 1rem; \}/)
})

test('el proceso del estudiante evita columnas apretadas dentro del detalle', async () => {
  const css = await readFile(estudianteCssPath, 'utf8')

  assert.match(css, /container-type: inline-size/)
  assert.match(css, /@container \(max-width: 650px\)/)
  assert.match(css, /\.evaluacion-estudiante__defense,[\s\S]*grid-template-columns: minmax\(0, 1fr\)/)
})
