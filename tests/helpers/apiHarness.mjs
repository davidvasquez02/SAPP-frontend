import { createTestServer } from './createTestServer.mjs'

export async function apiHarness(t, config = {}) {
  const server = await createTestServer({ configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', ...config })
  t.after(() => server.close())
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map()
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  t.after(() => previous ? Object.defineProperty(globalThis, 'localStorage', previous) : delete globalThis.localStorage)
  const requests = []
  let respond = () => Response.json({ ok: true, data: null, message: '' })
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push({ url: String(url), init, headers: new Headers(init?.headers) })
    return respond(url, init)
  })
  return {
    load: path => server.ssrLoadModule(path), storage, requests,
    reply: (data, options = {}) => { respond = () => Response.json({ ok: true, data, message: '', ...options }) },
    response: fn => { respond = fn },
  }
}
