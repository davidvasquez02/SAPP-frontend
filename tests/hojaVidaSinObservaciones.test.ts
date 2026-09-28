import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL(
  '../src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx',
  import.meta.url,
)
const sectionPath = new URL(
  '../src/modules/admisiones/components/EvaluacionEtapaSection/EvaluacionEtapaSection.tsx',
  import.meta.url,
)

test('oculta observaciones en hoja de vida y las envía vacías al backend', async () => {
  const [pageSource, sectionSource] = await Promise.all([
    readFile(pagePath, 'utf8'),
    readFile(sectionPath, 'utf8'),
  ])

  assert.match(pageSource, /showObservations=\{!isHojaDeVida\}/)
  assert.match(pageSource, /observaciones: isHojaDeVida\s*\? null/)
  assert.match(sectionSource, /showObservations\?: boolean/)
  assert.match(sectionSource, /showObservations \? <th>Observaciones<\/th> : null/)
  assert.match(sectionSource, /showObservations \? \(\s*<td data-label="Observaciones">/)
})
