const LETTER_WIDTH_PT = 612
const LETTER_HEIGHT_PT = 792
const LETTER_WIDTH_PX = 816
const LETTER_HEIGHT_PX = 1056
// 0.75 in at the 96 DPI used to rasterize the Letter-size document.
const VERTICAL_PAGE_MARGIN_PX = 72
const PAGE_CONTENT_HEIGHT_PX = LETTER_HEIGHT_PX - (VERTICAL_PAGE_MARGIN_PX * 2)

const BASE64_IMAGE_TYPES: Array<[RegExp, string]> = [
  [/^\/9j\//, 'image/jpeg'],
  [/^iVBORw0KGgo/, 'image/png'],
  [/^R0lGOD/, 'image/gif'],
  [/^UklGR/, 'image/webp'],
]
const SAFE_DATA_IMAGE_PATTERN = /^data:image\/(?:jpeg|png|gif|webp);base64,/i
const RESOURCE_ATTRIBUTES = ['src', 'href', 'xlink:href', 'srcset', 'poster', 'background'] as const

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

const resolveSafeImageSource = (source: string): string | null => {
  const compactSource = source.replace(/\s/g, '')
  if (SAFE_DATA_IMAGE_PATTERN.test(compactSource)) {
    return compactSource
  }
  const match = BASE64_IMAGE_TYPES.find(([pattern]) => pattern.test(compactSource))
  return match ? `data:${match[1]};base64,${compactSource}` : null
}

const removeExternalCssUrls = (css: string): string =>
  css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (declaration, _quote: string, url: string) =>
    SAFE_DATA_IMAGE_PATTERN.test(url.trim()) ? declaration : 'none',
  )

/** Sanitizes resources before the HTML ever reaches a live document, so it cannot issue requests or taint a canvas. */
const prepareHtmlForRendering = (html: string): string => {
  const parsed = new DOMParser().parseFromString(html, 'text/html')

  const contentSecurityPolicy = parsed.createElement('meta')
  contentSecurityPolicy.httpEquiv = 'Content-Security-Policy'
  contentSecurityPolicy.content = "default-src 'none'; img-src data:; style-src 'unsafe-inline'"
  parsed.head.prepend(contentSecurityPolicy)

  parsed.querySelectorAll('script, link, iframe, object, embed, video, audio, source').forEach((element) => element.remove())
  parsed.querySelectorAll('style').forEach((style) => {
    style.textContent = removeExternalCssUrls(style.textContent ?? '')
  })
  parsed.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
    element.setAttribute('style', removeExternalCssUrls(element.getAttribute('style') ?? ''))
  })

  Array.from(parsed.images).forEach((image) => {
    const source = image.getAttribute('src')?.trim() ?? ''
    const safeImageSource = resolveSafeImageSource(source)
    if (safeImageSource) {
      image.setAttribute('src', safeImageSource)
    } else {
      image.removeAttribute('src')
    }
    // A srcset takes precedence over src and could turn a raw JPEG base64 value into a relative URL.
    image.removeAttribute('srcset')
  })

  parsed.querySelectorAll('*').forEach((element) => {
    for (const attribute of RESOURCE_ATTRIBUTES) {
      const value = element.getAttribute(attribute)?.trim()
      const safeImageSource = element.tagName === 'IMG' && value != null && SAFE_DATA_IMAGE_PATTERN.test(value)
      if (value && !safeImageSource && !value.startsWith('#')) {
        element.removeAttribute(attribute)
      }
    }
  })

  return `<!doctype html>${parsed.documentElement.outerHTML}`
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
  const preparedHtml = prepareHtmlForRendering(html)
  const frame = document.createElement('iframe')
  frame.setAttribute('sandbox', 'allow-same-origin')
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${LETTER_WIDTH_PX}px;height:${LETTER_HEIGHT_PX}px;border:0;`
  document.body.appendChild(frame)

  try {
    const loaded = waitForFrame(frame)
    frame.srcdoc = preparedHtml
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
    const pageCount = Math.ceil(height / PAGE_CONTENT_HEIGHT_PX)
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
      const sourceY = page * PAGE_CONTENT_HEIGHT_PX
      const sourceHeight = Math.min(PAGE_CONTENT_HEIGHT_PX, height - sourceY)
      context.drawImage(
        rendered,
        0,
        sourceY,
        LETTER_WIDTH_PX,
        sourceHeight,
        0,
        VERTICAL_PAGE_MARGIN_PX,
        LETTER_WIDTH_PX,
        sourceHeight,
      )
      pages.push(dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.95)))
    }

    return createPdf(pages)
  } finally {
    frame.remove()
  }
}
