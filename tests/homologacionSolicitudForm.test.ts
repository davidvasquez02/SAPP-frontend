import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentPath = new URL(
  '../src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx',
  import.meta.url,
)
const stylesPath = new URL(
  '../src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.css',
  import.meta.url,
)
const typesPath = new URL('../src/modules/solicitudes/api/types.ts', import.meta.url)

test('presenta alineados los controles de homologación y una acción compacta', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentPath, 'utf8'),
    readFile(stylesPath, 'utf8'),
  ])

  assert.match(component, /solicitud-estudiante-form__homologacion-alignment/)
  assert.match(component, /solicitud-estudiante-form__add-homologacion/)
  assert.match(component, /Agregar asignaturas/)
  assert.doesNotMatch(component, /Agregar otro par|Agregar par de homologación/)
  assert.match(styles, /\.solicitud-estudiante-form__homologacion-alignment/)
  assert.match(styles, /\.solicitud-estudiante-form__add-homologacion[\s\S]*?width: auto;/)
})

test('exige y envía el código cuando la asignatura de origen es nueva', async () => {
  const [component, types] = await Promise.all([
    readFile(componentPath, 'utf8'),
    readFile(typesPath, 'utf8'),
  ])

  assert.match(component, /item\.codigoAsignaturaExterna\.trim\(\) === '' \|\| item\.nombreAsignaturaExterna\.trim\(\) === ''/)
  assert.match(component, /<input required aria-label={`Código materia origen/)
  assert.match(component, /placeholder="Código de la materia \*"/)
  assert.match(component, /codigoAsignaturaExterna: item\.codigoAsignaturaExterna\.trim\(\)/)
  assert.match(types, /codigoAsignaturaExterna: string/)
  assert.doesNotMatch(types, /codigoAsignaturaExterna\?: string/)
})
