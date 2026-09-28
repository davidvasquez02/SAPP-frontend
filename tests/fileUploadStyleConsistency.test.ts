import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const actasPage = readFileSync('src/pages/Actas/ActasPage.tsx', 'utf8')
const documentUploadCard = readFileSync('src/components/DocumentUploadCard/DocumentUploadCard.tsx', 'utf8')
const fileSelectStyles = readFileSync('src/components/FileSelectButton/FileSelectButton.css', 'utf8')

test('actas y las tarjetas documentales reutilizan el mismo selector de archivos', () => {
  assert.match(actasPage, /<FileSelectButton accept="application\/pdf,\.pdf"/)
  assert.match(documentUploadCard, /<FileSelectButton/)
  assert.doesNotMatch(actasPage, /<input type="file"/)
})

test('el selector compartido usa tokens semánticos y presenta un foco visible', () => {
  assert.match(fileSelectStyles, /var\(--outline\)/)
  assert.match(fileSelectStyles, /var\(--surface\)/)
  assert.match(fileSelectStyles, /var\(--primary\)/)
  assert.match(fileSelectStyles, /:focus-within/)
})
