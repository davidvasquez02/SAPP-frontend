import assert from 'node:assert/strict'
import test from 'node:test'
import {
  limitarDocumentosSoporte,
  MAX_DOCUMENTOS_SOPORTE_ADICIONAL,
  permiteMultiplesArchivos,
} from '../src/modules/solicitudes/utils/documentosSolicitud.ts'

test('permite varios archivos para Documento soporte adicional sin depender de mayusculas o tildes', () => {
  assert.equal(permiteMultiplesArchivos({ nombre: 'Documento soporte adicional' }), true)
  assert.equal(permiteMultiplesArchivos({ codigo: 'DOCUMENTO_SOPORTE_ADICIONAL', nombre: 'Anexos' }), true)
  assert.equal(permiteMultiplesArchivos({ nombre: 'Soporte adicional' }), true)
})

test('mantiene un solo archivo para los demas tipos documentales', () => {
  assert.equal(permiteMultiplesArchivos({ codigo: 'CARTA_SOLICITUD', nombre: 'Carta de solicitud' }), false)
})

test('limita a cinco los documentos de soporte aunque se agreguen en varias tandas', () => {
  const archivos = Array.from({ length: 7 }, (_, index) => new File(['pdf'], `soporte-${index + 1}.pdf`))
  const primeraSeleccion = limitarDocumentosSoporte([], archivos.slice(0, 3))
  const seleccionFinal = limitarDocumentosSoporte(primeraSeleccion, archivos.slice(3))

  assert.equal(MAX_DOCUMENTOS_SOPORTE_ADICIONAL, 5)
  assert.deepEqual(seleccionFinal.map((archivo) => archivo.name), archivos.slice(0, 5).map((archivo) => archivo.name))
})
