import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createRoutesFromChildren, matchRoutes, MemoryRouter, Routes } from 'react-router-dom'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Ejecutar por separado de la suite ligera: esta prueba monta Vite SSR y requiere
// un entorno que permita su servidor y la resolución de dependencias locales.

test('las rutas reales montan las secciones y protegen el módulo por perfil administrativo', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
    logLevel: 'error',
  })
  try {
    const { administracionAcademicaRoutes } = await server.ssrLoadModule('/src/app/routes/administracionAcademicaRoutes.tsx')
    const { AuthContext } = await server.ssrLoadModule('/src/context/Auth/context.ts')
    const { getPrimaryNavigationItems } = await server.ssrLoadModule('/src/app/navigationItems.ts')
    const routes = createRoutesFromChildren(administracionAcademicaRoutes)
    const suffixes = [
      'calendario', 'calendario/periodos', 'profesores', 'grupos-investigacion',
      'grupos-investigacion/nuevo', 'grupos-investigacion/42/editar',
      'grupos-investigacion/profesores', 'grupos-investigacion/instituciones',
      'grupos-investigacion/instituciones/escuelas/nueva',
      'grupos-investigacion/instituciones/facultades/nueva',
      'plantillas-correo', 'plantillas-correo/17/editar',
    ]
    for (const suffix of suffixes) {
      const matches = matchRoutes(routes, `/administracion-academica/${suffix}`)
      assert.equal(matches?.length, 2, suffix)
      assert.ok(matches.at(-1).route.element, suffix)
    }
    assert.equal(matchRoutes(routes, '/administracion-academica/grupos-investigacion/42/editar').at(-1).params.grupoId, '42')
    assert.equal(matchRoutes(routes, '/administracion-academica/plantillas-correo/17/editar').at(-1).params.plantillaId, '17')
    for (const path of ['/fechas/periodos', '/coordinacion/profesores', '/coordinacion/grupos-investigacion/42/editar', '/coordinacion/plantillas-correo/17/editar']) {
      assert.ok(matchRoutes(routes, path), path)
    }

    const renderFor = (roles) => {
      const user = { roles, nombreCompleto: 'Persona de prueba', username: 'prueba' }
      return renderToString(createElement(AuthContext.Provider, { value: { user, session: { kind: 'SAPP', user } } },
        createElement(MemoryRouter, { initialEntries: ['/administracion-academica/plantillas-correo'] },
          createElement(Routes, null, administracionAcademicaRoutes))))
    }
    for (const roles of [
      ['COORDINADOR_POSGRADOS'], ['SECRETARIA_POSGRADOS'], ['ADMIN_POSGRADOS'],
      ['SECRETARIA'], ['COORDINADOR_POSGRADOS', 'DIRECTOR'],
    ]) {
      const markup = renderFor(roles)
      assert.match(markup, /Administración académica/)
      assert.match(markup, /Cargando plantillas/)
      assert.equal((markup.match(/<main/g) ?? []).length, 1, 'Una sola cabecera/contenedor institucional')
      assert.equal((markup.match(/Identidad institucional/g) ?? []).length, 1)
      assert.match(markup, /aria-current="page"/)
      const items = getPrimaryNavigationItems(roles)
      assert.equal(items.filter(item => item.to === '/administracion-academica').length, 1)
      assert.ok(!items.some(item => ['/fechas', '/coordinacion/profesores', '/coordinacion/grupos-investigacion', '/coordinacion/plantillas-correo'].includes(item.to)))
    }
    for (const roles of [[], ['ESTUDIANTE_POSGRADOS'], ['DOCENTE_POSGRADOS'], ['DIRECTOR']]) {
      assert.equal(renderFor(roles), '')
      assert.ok(!getPrimaryNavigationItems(roles).some(item => item.to === '/administracion-academica'))
    }
  } finally {
    await server.close()
  }
})
