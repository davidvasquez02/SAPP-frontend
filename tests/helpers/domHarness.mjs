import { JSDOM } from 'jsdom'
import react from '@vitejs/plugin-react-swc'
import { apiHarness } from './apiHarness.mjs'

export async function domHarness(t) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://sapp.example.test/' })
  const originals = new Map()
  for (const [key, value] of Object.entries({
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, MutationObserver: dom.window.MutationObserver,
    FileReader: dom.window.FileReader, getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  }
  let testing
  const cleanup = async () => {
    if (testing) await testing.act(async () => testing.cleanup())
    // React puede programar trabajo con setImmediate incluso después de desmontar.
    await new Promise(resolve => setImmediate(resolve))
  }
  t.after(async () => {
    await cleanup()
    dom.window.close()
    for (const [key, original] of originals) {
      if (original) Object.defineProperty(globalThis, key, original)
      else delete globalThis[key]
    }
  })
  testing = await import('@testing-library/react/pure.js')
  return { dom, ...testing, cleanup }
}

export async function reactApiHarness(t) {
  const ui = await domHarness(t)
  const api = await apiHarness(t, { plugins: [react()] })
  return { ...api, ...ui }
}
