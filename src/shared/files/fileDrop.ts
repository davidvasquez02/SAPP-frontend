/**
 * Cargar archivos arrastrándolos desde el explorador, en cualquier pantalla con un <input type="file">.
 *
 * No reemplaza el botón de cargar: al soltar un archivo se pone en el input de la zona y se dispara su evento
 * `change`, de modo que cada pantalla lo trata exactamente igual que si el usuario lo hubiera elegido con el botón
 * (mismas validaciones, mismos mensajes). Por eso no hay que tocar cada punto de carga.
 *
 * La zona de soltado de un input es la tarjeta o fila más amplia que lo contiene a él solo (artículo, sección, fila de
 * tabla, elemento de lista, formulario o diálogo). Una zona con varios inputs no es zona: el archivo se suelta sobre
 * la tarjeta o fila concreta. Un input con data-file-drop="off" no participa.
 */

const INPUT_SELECTOR = 'input[type="file"]:not([data-file-drop="off"])'
const BOUNDARY_SELECTOR = 'article, section, form, tr, li, dialog, [role="dialog"], main, aside'

export const FILE_DROP_ACTIVE_CLASS = 'file-drop-active'

export interface FileDropTarget {
  scope: HTMLElement
  input: HTMLInputElement
}

const countInputs = (element: Element): number => element.querySelectorAll(INPUT_SELECTOR).length

/** El documento entero nunca es una zona de soltado. */
const isPageRoot = (element: Element): boolean => element.tagName === 'BODY' || element.tagName === 'HTML'

/** Zona de soltado (y su input) para el elemento sobre el que está el cursor; null si no hay una zona inequívoca. */
export const findDropTarget = (start: EventTarget | null): FileDropTarget | null => {
  let node: Element | null = start instanceof Element ? start : start instanceof Node ? start.parentElement : null

  // primer ancestro que contiene algún input
  while (node && countInputs(node) === 0) node = node.parentElement
  if (!node || countInputs(node) !== 1 || isPageRoot(node)) return null

  // se sube mientras siga conteniendo ese único input, sin pasar de la tarjeta/sección/fila que lo envuelve ni de la página
  while (!node.matches(BOUNDARY_SELECTOR)) {
    const parent: HTMLElement | null = node.parentElement
    if (!parent || isPageRoot(parent) || countInputs(parent) !== 1) break
    node = parent
  }

  const input = node.querySelector<HTMLInputElement>(INPUT_SELECTOR)
  return input && node instanceof HTMLElement ? { scope: node, input } : null
}

export const hasFiles = (event: DragEvent): boolean => Array.from(event.dataTransfer?.types ?? []).includes('Files')

/** Archivos que sí se pueden cargar: sin carpetas, y solo el primero si el input no admite varios. */
export const filesForInput = (dataTransfer: DataTransfer, input: HTMLInputElement): File[] => {
  const items = Array.from(dataTransfer.items ?? [])
  const files: File[] = []

  if (items.length > 0) {
    for (const item of items) {
      if (item.kind !== 'file') continue
      const entry = (item as DataTransferItem & { webkitGetAsEntry?: () => { isDirectory: boolean } | null }).webkitGetAsEntry?.()
      if (entry?.isDirectory) continue
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  } else {
    files.push(...Array.from(dataTransfer.files))
  }

  return input.multiple ? files : files.slice(0, 1)
}

/** Pone los archivos en el input y avisa a la pantalla igual que lo haría el selector de archivos del navegador. */
export const applyFilesToInput = (input: HTMLInputElement, files: File[]): boolean => {
  if (files.length === 0 || input.disabled) return false

  try {
    const transfer = new DataTransfer()
    files.forEach((file) => transfer.items.add(file))
    input.files = transfer.files
  } catch {
    return false
  }

  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

/**
 * Activa la carga por arrastre en todo el documento. Se llama una vez al arrancar la aplicación; devuelve la función
 * que lo desactiva. Soltar un archivo donde no hay una zona de carga no hace nada (el navegador no lo abre).
 */
export const installFileDrop = (doc: Document = document): (() => void) => {
  let active: HTMLElement | null = null

  const setActive = (next: HTMLElement | null) => {
    if (active === next) return
    active?.classList.remove(FILE_DROP_ACTIVE_CLASS)
    next?.classList.add(FILE_DROP_ACTIVE_CLASS)
    active = next
  }

  const onDragOver = (event: DragEvent) => {
    if (!hasFiles(event)) return
    // sin preventDefault el navegador abriría el archivo al soltarlo fuera de una zona de carga
    event.preventDefault()
    const target = findDropTarget(event.target)
    const accepts = Boolean(target) && !target!.input.disabled
    if (event.dataTransfer) event.dataTransfer.dropEffect = accepts ? 'copy' : 'none'
    setActive(accepts ? target!.scope : null)
  }

  const onDragLeave = (event: DragEvent) => {
    // salir de la ventana: relatedTarget es null
    if (!event.relatedTarget) setActive(null)
  }

  const onDrop = (event: DragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    setActive(null)
    const target = findDropTarget(event.target)
    if (!target || !event.dataTransfer) return
    applyFilesToInput(target.input, filesForInput(event.dataTransfer, target.input))
  }

  const clear = () => setActive(null)

  doc.addEventListener('dragenter', onDragOver)
  doc.addEventListener('dragover', onDragOver)
  doc.addEventListener('dragleave', onDragLeave)
  doc.addEventListener('drop', onDrop)
  doc.addEventListener('dragend', clear)

  return () => {
    doc.removeEventListener('dragenter', onDragOver)
    doc.removeEventListener('dragover', onDragOver)
    doc.removeEventListener('dragleave', onDragLeave)
    doc.removeEventListener('drop', onDrop)
    doc.removeEventListener('dragend', clear)
    clear()
  }
}
