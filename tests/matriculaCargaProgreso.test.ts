import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const pageSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')
const stylesSource = readFileSync('src/pages/Matricula/MatriculaPage.css', 'utf8')

test('bloquea el formulario y comunica el progreso durante la creación de matrícula', () => {
  assert.match(pageSource, /isSubmitting \? \(\s*<div className="matricula-page__progress" role="status" aria-live="assertive"/)
  assert.match(pageSource, /No cierre ni modifique la solicitud\./)
  assert.match(pageSource, /setSubmissionStage\("PREPARING_DOCUMENTS"\)/)
  assert.match(pageSource, /setSubmissionStage\("CREATING"\)/)
  assert.match(pageSource, /setSubmissionStage\("UPLOADING"\)/)
  assert.match(pageSource, /uploadDisabledOnly={isSubmitting \|\| isReadOnlyMatriculaFinalizada \|\| isExistingMatriculaBlocked}/)
  assert.match(stylesSource, /\.matricula-page__progress \{\s*position: fixed;/)
  assert.match(stylesSource, /\.matricula-page__spinner/)
})
