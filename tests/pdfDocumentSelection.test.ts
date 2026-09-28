import assert from 'node:assert/strict'
import test from 'node:test'
import { isPdfFile, PDF_FILE_ACCEPT } from '../src/shared/files/pdfFile.ts'

test('configura el selector para mostrar solamente archivos PDF', () => {
  assert.equal(PDF_FILE_ACCEPT, 'application/pdf,.pdf')
})

test('acepta archivos identificados como PDF por MIME o extension', () => {
  assert.equal(isPdfFile(new File(['pdf'], 'solicitud.pdf', { type: 'application/octet-stream' })), true)
  assert.equal(isPdfFile(new File(['pdf'], 'documento', { type: 'application/pdf' })), true)
  assert.equal(isPdfFile(new File(['imagen'], 'soporte.png', { type: 'image/png' })), false)
  assert.equal(isPdfFile(new File(['texto'], 'soporte.docx')), false)
})
