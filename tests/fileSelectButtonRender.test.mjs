import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTestServer as createServer } from './helpers/createTestServer.mjs'
import react from '@vitejs/plugin-react-swc'

test('selector de archivo React: asociación accesible, atributos y estado deshabilitado', async t => {
  const server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
  })
  t.after(() => server.close())
  const { FileSelectButton } = await server.ssrLoadModule('/src/components/FileSelectButton/FileSelectButton.tsx')

  const enabled = renderToStaticMarkup(createElement(FileSelectButton, {
    id: 'certificado', accept: 'application/pdf', name: 'documento',
  }, 'Seleccionar certificado'))
  assert.match(enabled, /for="certificado"/)
  assert.match(enabled, /id="certificado"/)
  assert.match(enabled, /type="file"/)
  assert.match(enabled, /accept="application\/pdf"/)
  assert.match(enabled, /name="documento"/)
  assert.match(enabled, /Seleccionar certificado/)
  assert.doesNotMatch(enabled, /disabled/)

  const disabled = renderToStaticMarkup(createElement(FileSelectButton, { disabled: true }, 'Subiendo'))
  assert.match(disabled, /file-select-button--disabled/)
  assert.match(disabled, /disabled=""/)
  const inputId = disabled.match(/<input[^>]*id="([^"]+)"/)?.[1]
  assert.ok(inputId, 'React genera un id cuando no se proporciona')
  assert.ok(disabled.includes(`for="${inputId}"`), 'la etiqueta apunta al input generado')
})
