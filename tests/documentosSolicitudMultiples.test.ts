import assert from 'node:assert/strict'
import test from 'node:test'
import { permiteMultiplesArchivos } from '../src/modules/solicitudes/utils/documentosSolicitud.ts'

test('permite varios archivos para Documento soporte adicional sin depender de mayusculas o tildes', () => {
  assert.equal(permiteMultiplesArchivos({ nombre: 'Documento soporte adicional' }), true)
  assert.equal(permiteMultiplesArchivos({ codigo: 'DOCUMENTO_SOPORTE_ADICIONAL', nombre: 'Anexos' }), true)
  assert.equal(permiteMultiplesArchivos({ nombre: 'Soporte adicional' }), true)
})

test('mantiene un solo archivo para los demas tipos documentales', () => {
  assert.equal(permiteMultiplesArchivos({ codigo: 'CARTA_SOLICITUD', nombre: 'Carta de solicitud' }), false)
})
