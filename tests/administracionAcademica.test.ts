import assert from 'node:assert/strict'
import test from 'node:test'
import {
  destinoAdministracion,
  migrarRutaAdministracion,
} from '../src/modules/administracionAcademica/rutas.ts'

test('los enlaces anteriores conservan las páginas profundas de administración', () => {
  const casos = [
    ['/fechas', '/administracion-academica/calendario'],
    ['/fechas/periodos', '/administracion-academica/calendario/periodos'],
    ['/coordinacion/profesores', '/administracion-academica/profesores'],
    ['/coordinacion/grupos-investigacion', '/administracion-academica/grupos-investigacion'],
    ['/coordinacion/grupos-investigacion/42/editar', '/administracion-academica/grupos-investigacion/42/editar'],
    ['/coordinacion/grupos-investigacion/nuevo', '/administracion-academica/grupos-investigacion/nuevo'],
    ['/coordinacion/grupos-investigacion/profesores', '/administracion-academica/grupos-investigacion/profesores'],
    ['/coordinacion/grupos-investigacion/instituciones', '/administracion-academica/grupos-investigacion/instituciones'],
    ['/coordinacion/grupos-investigacion/instituciones/escuelas/nueva', '/administracion-academica/grupos-investigacion/instituciones/escuelas/nueva'],
    ['/coordinacion/grupos-investigacion/instituciones/facultades/nueva', '/administracion-academica/grupos-investigacion/instituciones/facultades/nueva'],
    ['/coordinacion/plantillas-correo', '/administracion-academica/plantillas-correo'],
    ['/coordinacion/plantillas-correo/17/editar', '/administracion-academica/plantillas-correo/17/editar'],
  ]
  for (const [anterior, esperado] of casos) {
    assert.equal(migrarRutaAdministracion(anterior), esperado, anterior)
  }
})

test('editar un período desde un enlace guardado conserva la selección y el fragmento', () => {
  assert.deepEqual(destinoAdministracion({
    pathname: '/fechas/periodos', search: '?periodoId=27&origen=admisiones', hash: '#matricula',
  }), {
    pathname: '/administracion-academica/calendario/periodos',
    search: '?periodoId=27&origen=admisiones', hash: '#matricula',
  })
})

test('la migración no captura rutas de otros módulos ni redirige las nuevas otra vez', () => {
  for (const pathname of [
    '/admisiones/convocatorias', '/coordinacion/estudiantes', '/fechas-extra',
    '/coordinacion/profesores-invitados', '/coordinacion/plantillas-correo-extra',
    '/administracion-academica/plantillas-correo/17/editar',
  ]) assert.equal(migrarRutaAdministracion(pathname), null, pathname)
  assert.equal(migrarRutaAdministracion('/fechas/'), '/administracion-academica/calendario/')
})
