import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL(
  '../src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx',
  import.meta.url,
)
const servicePath = new URL(
  '../src/modules/admisiones/api/convocatoriaAdmisionService.ts',
  import.meta.url,
)
const dialogPath = new URL(
  '../src/modules/admisiones/components/EvaluadoresConvocatoriaDialog/EvaluadoresConvocatoriaDialog.tsx',
  import.meta.url,
)
const stylesPath = new URL(
  '../src/modules/admisiones/components/EvaluadoresConvocatoriaDialog/EvaluadoresConvocatoriaDialog.css',
  import.meta.url,
)

test('consulta los evaluadores desde el endpoint de la convocatoria', async () => {
  const service = await readFile(servicePath, 'utf8')

  assert.match(service, /`\/sapp\/evaluadorConvocatoria\/convocatoria\/\$\{convocatoriaId\}`/)
  assert.match(service, /return response\.data \?\? \[\]/)
})

test('ofrece la consulta informativa únicamente a coordinación', async () => {
  const page = await readFile(pagePath, 'utf8')

  assert.match(page, /hasAnyRole\(session\.user\.roles, \[ROLES\.COORDINACION\]\)/)
  assert.match(page, />\s*Ver evaluadores\s*<\/button>/)
  assert.match(page, /void loadEvaluadores\(\)/)
  assert.match(page, /<EvaluadoresConvocatoriaDialog/)
})

test('el diálogo presenta estados de carga, error, vacío y resultados sin exponer identificadores', async () => {
  const [dialog, styles] = await Promise.all([
    readFile(dialogPath, 'utf8'),
    readFile(stylesPath, 'utf8'),
  ])

  assert.match(dialog, /Consultando evaluadores…/)
  assert.match(dialog, /No hay evaluadores registrados para esta convocatoria\./)
  assert.match(dialog, /<strong>{evaluador\.evaluador\.trim\(\)/)
  assert.match(dialog, /<span>{evaluador\.programa/)
  assert.doesNotMatch(dialog, /evaluador\.evaluadorId|evaluador\.convocatoriaId/)
  assert.match(styles, /var\(--surface\)/)
  assert.match(styles, /var\(--primary\)/)
  assert.match(styles, /@media \(max-width: 560px\)/)
})
