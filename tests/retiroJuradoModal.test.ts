import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const panelPath = new URL('../src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx', import.meta.url)
const stylesPath = new URL('../src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.css', import.meta.url)

test('retirar un jurado usa el diálogo institucional en lugar de window.confirm', async () => {
  const source = await readFile(panelPath, 'utf8')

  assert.doesNotMatch(source, /window\.confirm/)
  assert.match(source, /role="dialog"/)
  assert.match(source, /aria-modal="true"/)
  assert.match(source, /Retirar jurado evaluador/)
  assert.match(source, /Sí, retirar jurado/)
  assert.match(source, /setJuradoARetirar\(item\)/)
  assert.doesNotMatch(source, /<button className="evaluacion-tg__confirmation-backdrop"/)
  assert.match(source, /className="evaluacion-tg__confirmation" role="presentation" onMouseDown=/)
})

test('el diálogo de retiro conserva tokens de tema y adaptación móvil', async () => {
  const styles = await readFile(stylesPath, 'utf8')

  assert.match(styles, /\.evaluacion-tg__confirmation-dialog/)
  assert.match(styles, /\.evaluacion-tg__confirmation \{[^}]*background:[^;]*transparent 48%/)
  assert.doesNotMatch(styles, /\.evaluacion-tg__confirmation-backdrop/)
  assert.match(styles, /background: var\(--surface\)/)
  assert.match(styles, /border[^;]*var\(--outline\)/)
  assert.match(styles, /background: var\(--danger\)/)
  assert.match(styles, /@media \(max-width: 440px\)/)
})
