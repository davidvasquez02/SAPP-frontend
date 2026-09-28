import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentPath = new URL(
  '../src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx',
  import.meta.url,
)
const stylesPath = new URL(
  '../src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.css',
  import.meta.url,
)

test('presenta los evaluadores automáticos y diferencia los adicionales', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentPath, 'utf8'),
    readFile(stylesPath, 'utf8'),
  ])

  assert.match(component, /<span>Evaluadores<\/span>/)
  assert.match(component, /label: 'Coordinador Posgrados'/)
  assert.match(component, /label: 'Director de Escuela'/)
  assert.match(component, /Evaluador incluido automáticamente/)
  assert.match(component, /Seleccione un evaluador adicional/)
  assert.doesNotMatch(component, /Debe seleccionar al menos un profesor/)
  assert.match(styles, /create-convocatoria-modal__chip--automatic/)
  assert.match(styles, /create-convocatoria-modal__automatic-badge/)
})
