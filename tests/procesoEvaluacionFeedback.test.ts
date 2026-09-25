import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const sourcePath = new URL('../src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx', import.meta.url)

test('el feedback exitoso desaparece después de cinco segundos', async () => {
  const source = await readFile(sourcePath, 'utf8')

  assert.match(source, /const SUCCESS_MESSAGE_DURATION_MS = 5_000/)
  assert.match(source, /window\.setTimeout\(\(\) => setMessage\(null\), SUCCESS_MESSAGE_DURATION_MS\)/)
  assert.match(source, /window\.clearTimeout\(timeoutId\)/)
})

test('oculta la acción duplicada mientras está abierto el formulario de evaluador', async () => {
  const source = await readFile(sourcePath, 'utf8')

  assert.match(source, /canManageJurors && formulario !== 'designar'/)
})
