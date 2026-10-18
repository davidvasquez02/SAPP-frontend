import { createServer } from 'vite'
import { coveragePlugin } from '../../scripts/coverage/instrument.mjs'

// Configuración compartida: no instrumenta nada durante npm test ni builds normales.
export function createTestServer(config) {
  return createServer({
    ...config,
    // Las pruebas cargan módulos SSR: no necesitan escanear HTML ni precompilar clientes.
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [
      ...(globalThis.__SAPP_COVERAGE__ ? [coveragePlugin()] : []),
      ...(config.plugins ?? []),
    ],
  })
}
