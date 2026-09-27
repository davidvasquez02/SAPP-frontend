import assert from 'node:assert/strict'
import test from 'node:test'
import { getAspiranteFotoSrc } from '../src/modules/admisiones/utils/aspiranteFoto.ts'

test('construye la foto del aspirante con el contenido y MIME enviados por el backend', () => {
  assert.equal(
    getAspiranteFotoSrc({ documentoId: 1, nombreArchivo: 'foto.png', contenidoBase64: 'YWJj', mimeType: 'image/png' }),
    'data:image/png;base64,YWJj',
  )
})

test('conserva URLs de datos y omite fotos sin contenido', () => {
  assert.equal(
    getAspiranteFotoSrc({ documentoId: 1, nombreArchivo: 'foto.jpg', contenidoBase64: 'data:image/jpeg;base64,YWJj', mimeType: null }),
    'data:image/jpeg;base64,YWJj',
  )
  assert.equal(getAspiranteFotoSrc(null), null)
})
