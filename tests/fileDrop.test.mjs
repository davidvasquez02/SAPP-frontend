import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import ts from 'typescript'

// El módulo es TypeScript sin dependencias: se transpila al vuelo para probarlo sin el arnés de Vite.
const fuente = await readFile(new URL('../src/shared/files/fileDrop.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(fuente, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const dir = await mkdtemp(path.join(tmpdir(), 'filedrop-'))
await writeFile(path.join(dir, 'fileDrop.mjs'), outputText)

const crearEntorno = (html) => {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
  const { window } = dom
  // jsdom no trae DataTransfer ni deja asignar input.files: se simulan lo justo para ejercitar el módulo.
  globalThis.window = window
  globalThis.document = window.document
  globalThis.Element = window.Element
  globalThis.Node = window.Node
  globalThis.HTMLElement = window.HTMLElement
  globalThis.Event = window.Event
  globalThis.DataTransfer = class {
    constructor() { this.list = []; this.items = { add: (file) => this.list.push(file) } }
    get files() { return this.list }
  }
  for (const input of window.document.querySelectorAll('input[type="file"]')) {
    let valor = []
    Object.defineProperty(input, 'files', { get: () => valor, set: (v) => { valor = v }, configurable: true })
  }
  return window
}

const modulo = await import(pathToFileURL(path.join(dir, 'fileDrop.mjs')).href)

const archivo = (nombre) => ({ name: nombre })
const dataTransfer = (archivos, { directorios = [] } = {}) => ({
  types: ['Files'],
  files: archivos,
  items: [
    ...archivos.map((f) => ({ kind: 'file', getAsFile: () => f, webkitGetAsEntry: () => ({ isDirectory: false }) })),
    ...directorios.map((nombre) => ({ kind: 'file', getAsFile: () => archivo(nombre), webkitGetAsEntry: () => ({ isDirectory: true }) })),
  ],
})
const soltar = (window, destino, dt, tipo = 'drop') => {
  const evento = new window.Event(tipo, { bubbles: true, cancelable: true })
  evento.dataTransfer = dt
  destino.dispatchEvent(evento)
  return evento
}

test('la zona de soltado es la tarjeta o fila que contiene un solo input', () => {
  const window = crearEntorno(`
    <main>
      <section id="uno"><h2>Doc A</h2><label><input type="file" id="a"></label></section>
      <section id="dos"><h2>Doc B</h2><label><input type="file" id="b"></label></section>
    </main>`)
  const a = modulo.findDropTarget(window.document.querySelector('#uno h2'))
  assert.equal(a.input.id, 'a')
  assert.equal(a.scope.id, 'uno')
  // el espacio entre tarjetas contiene varios inputs: no es zona
  assert.equal(modulo.findDropTarget(window.document.querySelector('main')), null)
  assert.equal(modulo.findDropTarget(window.document.body), null)
})

test('en una página con un solo input la zona llega hasta el contenedor, sin pasar de la sección', () => {
  const window = crearEntorno(`<main><section id="s"><form id="f"><div><label><span id="t">Subir</span><input type="file" id="a"></label></div></form></section><p id="fuera">otra cosa</p></main>`)
  const objetivo = modulo.findDropTarget(window.document.querySelector('#t'))
  assert.equal(objetivo.scope.id, 'f')
  // fuera de la sección la zona es la página (main), que contiene un solo input; nunca algo más amplio
  assert.equal(modulo.findDropTarget(window.document.querySelector('#fuera')).scope.tagName, 'MAIN')
  assert.equal(modulo.findDropTarget(window.document.body), null)
})

test('los inputs marcados con data-file-drop="off" no participan', () => {
  const window = crearEntorno('<section><button id="b">x</button><input type="file" data-file-drop="off"></section>')
  assert.equal(modulo.findDropTarget(window.document.querySelector('#b')), null)
})

test('soltar un archivo dispara change en el input y marca la zona mientras se arrastra', () => {
  const window = crearEntorno('<section id="z"><p id="p">Documento</p><input type="file" id="a"></section>')
  const quitar = modulo.installFileDrop(window.document)
  const input = window.document.querySelector('#a')
  const cambios = []
  input.addEventListener('change', () => cambios.push(input.files.map((f) => f.name)))

  const arrastre = soltar(window, window.document.querySelector('#p'), dataTransfer([archivo('cedula.pdf')]), 'dragover')
  assert.equal(arrastre.defaultPrevented, true)
  assert.ok(window.document.querySelector('#z').classList.contains(modulo.FILE_DROP_ACTIVE_CLASS))

  const soltado = soltar(window, window.document.querySelector('#p'), dataTransfer([archivo('cedula.pdf')]))
  assert.equal(soltado.defaultPrevented, true)
  assert.deepEqual(cambios, [['cedula.pdf']])
  assert.ok(!window.document.querySelector('#z').classList.contains(modulo.FILE_DROP_ACTIVE_CLASS))
  quitar()
})

test('sin multiple solo se toma el primer archivo; con multiple se toman todos; las carpetas se ignoran', () => {
  const window = crearEntorno('<section id="s1"><input type="file" id="uno"></section><section id="s2"><input type="file" id="varios" multiple></section>')
  const quitar = modulo.installFileDrop(window.document)
  const lote = [archivo('a.pdf'), archivo('b.pdf')]

  soltar(window, window.document.querySelector('#s1'), dataTransfer(lote))
  assert.deepEqual(window.document.querySelector('#uno').files.map((f) => f.name), ['a.pdf'])

  soltar(window, window.document.querySelector('#s2'), dataTransfer(lote, { directorios: ['carpeta'] }))
  assert.deepEqual(window.document.querySelector('#varios').files.map((f) => f.name), ['a.pdf', 'b.pdf'])
  quitar()
})

test('un input deshabilitado no recibe archivos y la zona no se resalta', () => {
  const window = crearEntorno('<section id="z"><input type="file" id="a" disabled></section>')
  const quitar = modulo.installFileDrop(window.document)
  const input = window.document.querySelector('#a')
  let cambios = 0
  input.addEventListener('change', () => cambios++)

  const arrastre = soltar(window, window.document.querySelector('#z'), dataTransfer([archivo('x.pdf')]), 'dragover')
  assert.equal(arrastre.dataTransfer.dropEffect, 'none')
  assert.ok(!window.document.querySelector('#z').classList.contains(modulo.FILE_DROP_ACTIVE_CLASS))
  soltar(window, window.document.querySelector('#z'), dataTransfer([archivo('x.pdf')]))
  assert.equal(cambios, 0)
  quitar()
})

test('soltar fuera de una zona no hace nada pero evita que el navegador abra el archivo', () => {
  const window = crearEntorno('<main><section><input type="file"></section><section><input type="file"></section></main>')
  const quitar = modulo.installFileDrop(window.document)
  let cambios = 0
  window.document.addEventListener('change', () => cambios++)

  const soltado = soltar(window, window.document.querySelector('main'), dataTransfer([archivo('x.pdf')]))
  assert.equal(soltado.defaultPrevented, true)
  assert.equal(cambios, 0)
  quitar()
})

test('arrastres que no son archivos (texto, enlaces) no se tocan', () => {
  const window = crearEntorno('<section><input type="file"></section>')
  const quitar = modulo.installFileDrop(window.document)
  const evento = soltar(window, window.document.querySelector('section'), { types: ['text/plain'], files: [], items: [] })
  assert.equal(evento.defaultPrevented, false)
  quitar()
})
