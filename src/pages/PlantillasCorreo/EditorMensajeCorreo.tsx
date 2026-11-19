import { useRef, useState } from 'react'
import { etiquetaVariable } from './vistaPrevia'

interface EditorMensajeCorreoProps {
  html: string
  variables: string[]
  onChange: (html: string) => void
}

const DOCUMENTO_EDITOR = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'">
<style>
  body { margin: 0; font: 16px/1.5 system-ui, sans-serif; background: white; color: #202124; }
  #mensaje { min-height: 280px; padding: 12px; overflow-wrap: anywhere; }
  #mensaje:focus-visible { outline: 2px solid Highlight; outline-offset: -2px; }
  [data-dato-editor] { background: #e7eefb; color: #203b69; border-radius: 4px; padding: 0 3px; }
</style></head><body><div id="mensaje" role="textbox" aria-label="Mensaje del correo" aria-multiline="true" contenteditable="true"></div></body></html>`

const crearEtiqueta = (doc: Document, nombre: string) => {
  const etiqueta = doc.createElement('span')
  etiqueta.dataset.datoEditor = `{{${nombre}}}`
  etiqueta.contentEditable = 'false'
  etiqueta.textContent = etiquetaVariable(nombre)
  return etiqueta
}

const EditorMensajeCorreo = ({ html, variables, onChange }: EditorMensajeCorreoProps) => {
  const iframe = useRef<HTMLIFrameElement>(null)
  const inicial = useRef(html)
  const seleccion = useRef<Range | null>(null)
  const [listo, setListo] = useState(false)
  const [editandoEnlace, setEditandoEnlace] = useState(false)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const cargar = () => {
    const doc = iframe.current?.contentDocument
    const mensaje = doc?.getElementById('mensaje')
    if (!doc || !mensaje) return
    mensaje.innerHTML = inicial.current
    const walker = doc.createTreeWalker(mensaje, window.NodeFilter.SHOW_TEXT)
    const nodos: Text[] = []
    while (walker.nextNode()) nodos.push(walker.currentNode as Text)
    for (const nodo of nodos) {
      if (nodo.parentElement?.closest('style, script, textarea, template')) continue
      const fragmento = doc.createDocumentFragment()
      const partes = nodo.data.split(/(\{\{\w+\}\})/g)
      if (partes.length === 1) continue
      partes.forEach((parte, indice) => {
        if (indice % 2 === 0) {
          fragmento.append(parte)
          return
        }
        fragmento.append(crearEtiqueta(doc, parte.slice(2, -2)))
      })
      nodo.replaceWith(fragmento)
    }

    const publicar = () => {
      const copia = mensaje.cloneNode(true) as HTMLElement
      copia.querySelectorAll<HTMLElement>('[data-dato-editor]').forEach((etiqueta) => {
        const dato = etiqueta.dataset.datoEditor
        if (dato && /^\{\{\w+\}\}$/.test(dato)) etiqueta.replaceWith(dato)
      })
      onChange(copia.textContent.trim() || copia.querySelector('img, hr, svg') ? copia.innerHTML : '')
    }
    doc.addEventListener('selectionchange', () => {
      const actual = doc.getSelection()
      if (actual?.rangeCount && mensaje.contains(actual.getRangeAt(0).commonAncestorContainer)) {
        seleccion.current = actual.getRangeAt(0).cloneRange()
      }
    })
    mensaje.addEventListener('input', publicar)
    mensaje.addEventListener('click', (evento) => {
      if ((evento.target as Element).closest('a, button, input, select, textarea')) evento.preventDefault()
    })
    mensaje.addEventListener('drop', (evento) => evento.preventDefault())
    mensaje.addEventListener('paste', (evento) => {
      evento.preventDefault()
      doc.execCommand('insertText', false, evento.clipboardData?.getData('text/plain') ?? '')
    })
    setListo(true)
  }

  const conSeleccion = (accion: (doc: Document, rango: Range, mensaje: HTMLElement) => void) => {
    const doc = iframe.current?.contentDocument
    const mensaje = doc?.getElementById('mensaje')
    const actual = doc?.getSelection()
    if (!doc || !mensaje || !actual) return
    mensaje.focus()
    const rango = seleccion.current ?? doc.createRange()
    if (!seleccion.current || !mensaje.contains(rango.commonAncestorContainer)) {
      rango.selectNodeContents(mensaje)
      rango.collapse(false)
    }
    actual.removeAllRanges()
    actual.addRange(rango)
    accion(doc, rango, mensaje)
    if (actual.rangeCount) seleccion.current = actual.getRangeAt(0).cloneRange()
  }

  const ejecutar = (comando: string, valor?: string) => {
    conSeleccion((doc) => doc.execCommand(comando, false, valor))
  }

  const insertarDato = (nombre: string) => {
    if (!variables.includes(nombre)) return
    conSeleccion((doc, rango, mensaje) => {
      const espacio = doc.createTextNode('\u00a0')
      const fragmento = doc.createDocumentFragment()
      fragmento.append(crearEtiqueta(doc, nombre), espacio)
      rango.deleteContents()
      rango.insertNode(fragmento)
      rango.setStartAfter(espacio)
      rango.collapse(true)
      mensaje.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  const aplicarEnlace = () => {
    const direccion = url.trim()
    if (!/^https?:\/\//i.test(direccion) || !URL.canParse(direccion)) {
      setError('Escribe una dirección válida que empiece por https:// o http://.')
      return
    }
    ejecutar('createLink', direccion)
    setError('')
    setEditandoEnlace(false)
  }

  return (
    <>
      <div className="plantillas-correo__herramientas" role="group" aria-label="Formato del mensaje">
        <button type="button" className="plantillas-correo__secondary" disabled={!listo} onClick={() => ejecutar('bold')}>Negrita</button>
        <button type="button" className="plantillas-correo__secondary" disabled={!listo} onClick={() => ejecutar('insertUnorderedList')}>Lista</button>
        <button type="button" className="plantillas-correo__secondary" disabled={!listo} onClick={() => {
          if (!seleccion.current || seleccion.current.collapsed) {
            setError('Selecciona el texto del enlace en el mensaje.')
            return
          }
          setError('')
          setUrl('')
          setEditandoEnlace(true)
        }}>Enlace</button>
        {variables.length > 0 && (
          <select aria-label="Insertar dato en el mensaje" value="" disabled={!listo} onChange={(evento) => insertarDato(evento.target.value)}>
            <option value="" disabled>Insertar dato</option>
            {variables.map((nombre) => <option key={nombre} value={nombre}>{etiquetaVariable(nombre)}</option>)}
          </select>
        )}
      </div>
      {editandoEnlace && (
        <div className="plantillas-correo__herramientas">
          <input aria-label="Dirección del enlace" type="url" value={url} onChange={(evento) => setUrl(evento.target.value)} />
          <button type="button" className="plantillas-correo__primary" onClick={aplicarEnlace}>Aplicar enlace</button>
          <button type="button" className="plantillas-correo__secondary" onClick={() => { setEditandoEnlace(false); setError('') }}>Cancelar enlace</button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <iframe ref={iframe} title="Editor del mensaje" className="plantillas-correo__vista"
        sandbox="allow-same-origin" srcDoc={DOCUMENTO_EDITOR} onLoad={cargar} />
    </>
  )
}

export default EditorMensajeCorreo
