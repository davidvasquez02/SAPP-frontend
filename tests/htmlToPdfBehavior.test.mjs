import assert from 'node:assert/strict'
import test from 'node:test'
import { reactApiHarness } from './helpers/domHarness.mjs'

test('HTML a PDF: sanitización, estructura y limpieza con APIs gráficas simuladas', async t => {
  const ui = await reactApiHarness(t)
  const { htmlToPdf } = await ui.load('/src/modules/solicitudes/utils/htmlToPdf.ts')
  const originals = new Map()
  let painted, prepared, noCanvas, frameError, imageError
  for (const [key, value] of Object.entries({ DOMParser: ui.dom.window.DOMParser, NodeFilter: ui.dom.window.NodeFilter, Image: class {
    set src(value) { this.source = value; queueMicrotask(() => imageError ? this.onerror?.() : this.onload?.()) }
  } })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value })
  }
  t.after(() => { for (const [key, descriptor] of originals) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key] })
  const create = ui.dom.window.document.createElement.bind(ui.dom.window.document)
  t.mock.method(ui.dom.window.document, 'createElement', (tag, ...args) => {
    const element = create(tag, ...args)
    if (tag === 'canvas') {
      element.getContext = () => noCanvas ? null : new Proxy({}, { get(_target, name) { return (...args) => { painted.push({ name, args }) } }, set() { return true } })
      element.toDataURL = () => 'data:image/jpeg;base64,/9j/2Q=='
    }
    if (tag === 'iframe') Object.defineProperty(element, 'srcdoc', { configurable: true, set(html) {
      prepared = html
      queueMicrotask(() => {
        if (frameError) { element.onerror?.(); return }
        const d = element.contentDocument; d.open(); d.write(html); d.close()
        const w = element.contentWindow
        const rect = { left: 10, top: 10, right: 90, bottom: 30, width: 80, height: 20 }
        w.HTMLElement.prototype.getBoundingClientRect = () => rect
        w.Range.prototype.getBoundingClientRect = () => rect
        w.Range.prototype.getClientRects = () => [rect]
        for (const image of d.images) Object.defineProperty(image, 'complete', { value: true })
        element.onload?.()
      })
    } })
    return element
  })
  t.beforeEach(() => { painted = []; prepared = ''; noCanvas = false; frameError = false; imageError = false })
  await t.test('elimina recursos externos antes de renderizar y conserva imágenes seguras', async () => {
    const pdf = await htmlToPdf('<style>p{background:url(https://unsafe.invalid/x)}</style><script>bad()</script><iframe src="https://unsafe.invalid"></iframe><p style="color:red;background:blue;border:1px solid black;text-transform:uppercase">Texto</p><img src="https://unsafe.invalid/a" srcset="https://unsafe.invalid/b 2x"><img src="iVBORw0KGgo="><a href="https://unsafe.invalid">enlace</a>')
    const d = new ui.dom.window.DOMParser().parseFromString(prepared, 'text/html')
    assert.equal(d.querySelectorAll('script,iframe,link').length, 0); assert.equal(d.images[0].hasAttribute('src'), false); assert.equal(d.images[0].hasAttribute('srcset'), false)
    assert.equal(d.images[1].getAttribute('src'), 'data:image/png;base64,iVBORw0KGgo='); assert.equal(d.querySelector('a').hasAttribute('href'), false); assert.ok(d.querySelector('meta[http-equiv="Content-Security-Policy"]'))
    assert.equal(d.querySelector('style').textContent.includes('unsafe.invalid'), false); assert.equal(pdf.type, 'application/pdf'); assert.ok(painted.some(p => p.name === 'drawImage')); assert.ok(painted.some(p => p.name === 'fillText' && p.args[0] === 'TEXTO'))
    assert.equal(ui.dom.window.document.querySelectorAll('iframe').length, 0)
  })
  await t.test('PDF conserva índice de objetos, tamaño carta y páginas contiguas', async () => {
    const bytes = Buffer.from(await (await htmlToPdf('<p>Documento</p>')).arrayBuffer()); const text = bytes.toString('latin1')
    assert.ok(text.startsWith('%PDF-1.4')); assert.ok(text.includes('/MediaBox [0 0 612 792]')); assert.ok(text.endsWith('%%EOF'))
    const offset = Number(text.match(/startxref\n(\d+)/)[1]); assert.equal(text.slice(offset, offset + 4), 'xref')
    const entries = text.slice(offset).split('\n'); const count = Number(entries[1].split(' ')[1]); assert.ok(count > 3)
    for (let i = 1; i < count; i++) { const objectOffset = Number(entries[i + 2].slice(0, 10)); assert.ok(text.slice(objectOffset).startsWith(`${i} 0 obj`)) }
  })
  await t.test('sin canvas rechaza y retira iframe temporal', async () => {
    noCanvas = true; await assert.rejects(htmlToPdf('<p>Texto</p>'), /El navegador no permite generar el PDF/); assert.equal(ui.dom.window.document.querySelectorAll('iframe').length, 0)
  })
  await t.test('error de carga del iframe no deja documento temporal', async () => {
    frameError = true; await assert.rejects(htmlToPdf('<p>Texto</p>'), /No fue posible interpretar el documento HTML/); assert.equal(ui.dom.window.document.querySelectorAll('iframe').length, 0)
  })
  await t.test('error renderizando imagen segura propaga fallo y limpia recursos', async () => {
    imageError = true; await assert.rejects(htmlToPdf('<img src="data:image/png;base64,iVBORw0KGgo=">'), /No fue posible renderizar una imagen/); assert.equal(ui.dom.window.document.querySelectorAll('iframe').length, 0)
  })
  await t.test('descargar HTML convierte a PDF y normaliza el nombre sin conservar enlaces temporales', async s => {
    const { downloadSolicitudDocument } = await ui.load('/src/modules/solicitudes/utils/solicitudDocumentFile.ts')
    const blobs = [], downloads = [], revoked = []
    s.mock.method(URL, 'createObjectURL', blob => { blobs.push(blob); return `blob:documento-${blobs.length}` })
    s.mock.method(URL, 'revokeObjectURL', url => revoked.push(url))
    s.mock.method(ui.dom.window.HTMLAnchorElement.prototype, 'click', function () { downloads.push({ filename: this.download, href: this.href, rel: this.rel }) })
    const source = Buffer.from('<p>Documento sintético</p>').toString('base64')
    await downloadSolicitudDocument(source, 'TEXT/HTML; charset=utf-8', 'solicitud.html')
    await downloadSolicitudDocument(source, 'text/html', '.html')
    await ui.waitFor(() => assert.equal(revoked.length, 2))
    assert.deepEqual(downloads.map(d => d.filename), ['solicitud.pdf', 'documento.pdf'])
    assert.ok(downloads.every(d => d.rel === 'noopener'))
    assert.ok(blobs.every(b => b.type === 'application/pdf'))
    assert.deepEqual(revoked, downloads.map(d => d.href))
  })
  await t.test('abrir PDF preserva contenido y MIME y solicita ventana aislada', async s => {
    const { openSolicitudDocument, downloadSolicitudDocument, canPreviewSolicitudDocument } = await ui.load('/src/modules/solicitudes/utils/solicitudDocumentFile.ts')
    const blobs = [], opened = [], revoked = [], downloads = []
    s.mock.method(URL, 'createObjectURL', blob => { blobs.push(blob); return `blob:pdf-${blobs.length}` })
    s.mock.method(URL, 'revokeObjectURL', url => revoked.push(url))
    s.mock.method(ui.dom.window, 'open', (...args) => opened.push(args))
    const timeout = ui.dom.window.setTimeout.bind(ui.dom.window)
    s.mock.method(ui.dom.window, 'setTimeout', (fn, ms, ...args) => timeout(fn, ms === 60_000 ? 0 : ms, ...args))
    s.mock.method(ui.dom.window.HTMLAnchorElement.prototype, 'click', function () { downloads.push(this.download) })
    const source = Buffer.from('%PDF-1.4 documento sintético').toString('base64')
    await openSolicitudDocument(source, 'application/pdf', 'original.pdf')
    await downloadSolicitudDocument(source, 'application/pdf', 'original.pdf')
    await ui.waitFor(() => assert.equal(revoked.length, 2))
    assert.equal(await blobs[0].text(), '%PDF-1.4 documento sintético')
    assert.equal(blobs[0].type, 'application/pdf')
    assert.deepEqual(opened, [['blob:pdf-1', '_blank', 'noopener,noreferrer']])
    assert.deepEqual(downloads, ['original.pdf'])
    assert.equal(canPreviewSolicitudDocument(' APPLICATION/PDF; charset=utf-8'), true)
    assert.equal(canPreviewSolicitudDocument('text/html'), true)
    assert.equal(canPreviewSolicitudDocument('application/zip'), false)
  })
})
