const LETTER_WIDTH_PT = 612
const LETTER_HEIGHT_PT = 792
const LETTER_WIDTH_PX = 816
const LETTER_HEIGHT_PX = 1056

const waitForFrame = (frame: HTMLIFrameElement): Promise<void> =>
  new Promise((resolve, reject) => {
    frame.onload = () => resolve()
    frame.onerror = () => reject(new Error('No fue posible interpretar el documento HTML.'))
  })

const loadSvgImage = (svg: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(blobUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('No fue posible renderizar el documento HTML.'))
    }
    image.src = blobUrl
  })

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const binary = atob(encoded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

const createPdf = (pages: Uint8Array[]): Blob => {
  const encoder = new TextEncoder()
  const objects: Uint8Array[] = []
  const addObject = (value: string | Uint8Array): number => {
    objects.push(typeof value === 'string' ? encoder.encode(value) : value)
    return objects.length
  }

  const catalogId = addObject('')
  const pagesId = addObject('')
  const pageIds: number[] = []

  pages.forEach((jpeg, index) => {
    const imageHeader = encoder.encode(
      `<< /Type /XObject /Subtype /Image /Width ${LETTER_WIDTH_PX} /Height ${LETTER_HEIGHT_PX} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    )
    const imageId = addObject(new Uint8Array([...imageHeader, ...jpeg, ...encoder.encode('\nendstream')]))
    const stream = `q\n${LETTER_WIDTH_PT} 0 0 ${LETTER_HEIGHT_PT} 0 0 cm\n/Im${index} Do\nQ`
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${LETTER_WIDTH_PT} ${LETTER_HEIGHT_PT}] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    pageIds.push(pageId)
  })

  objects[catalogId - 1] = encoder.encode(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)
  objects[pagesId - 1] = encoder.encode(
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`,
  )

  const chunks: Uint8Array[] = [encoder.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')]
  const offsets = [0]
  let length = chunks[0].length
  objects.forEach((object, index) => {
    offsets.push(length)
    const wrapped = new Uint8Array([
      ...encoder.encode(`${index + 1} 0 obj\n`),
      ...object,
      ...encoder.encode('\nendobj\n'),
    ])
    chunks.push(wrapped)
    length += wrapped.length
  })
  const xrefOffset = length
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)
    .join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  chunks.push(encoder.encode(xref))
  return new Blob(chunks.map((chunk) => Uint8Array.from(chunk).buffer), { type: 'application/pdf' })
}

/** Converts the backend HTML template to a rasterized, printable Letter-size PDF in the browser. */
export async function htmlToPdf(html: string): Promise<Blob> {
  const frame = document.createElement('iframe')
  frame.setAttribute('sandbox', 'allow-same-origin')
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${LETTER_WIDTH_PX}px;height:${LETTER_HEIGHT_PX}px;border:0;`
  document.body.appendChild(frame)

  try {
    const loaded = waitForFrame(frame)
    frame.srcdoc = html
    await loaded

    const frameDocument = frame.contentDocument
    if (!frameDocument) {
      throw new Error('No fue posible acceder al documento HTML generado.')
    }
    await frameDocument.fonts?.ready
    await Promise.all(
      Array.from(frameDocument.images).map(
        (image) =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                image.addEventListener('load', () => resolve(), { once: true })
                image.addEventListener('error', () => resolve(), { once: true })
              }),
      ),
    )

    const height = Math.max(frameDocument.documentElement.scrollHeight, frameDocument.body.scrollHeight, LETTER_HEIGHT_PX)
    const serialized = new XMLSerializer().serializeToString(frameDocument.documentElement)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LETTER_WIDTH_PX}" height="${height}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`
    const rendered = await loadSvgImage(svg)
    const pageCount = Math.ceil(height / LETTER_HEIGHT_PX)
    const pages: Uint8Array[] = []

    for (let page = 0; page < pageCount; page += 1) {
      const canvas = document.createElement('canvas')
      canvas.width = LETTER_WIDTH_PX
      canvas.height = LETTER_HEIGHT_PX
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('El navegador no permite generar el PDF.')
      }
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(rendered, 0, -(page * LETTER_HEIGHT_PX))
      pages.push(dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.95)))
    }

    return createPdf(pages)
  } finally {
    frame.remove()
  }
}
