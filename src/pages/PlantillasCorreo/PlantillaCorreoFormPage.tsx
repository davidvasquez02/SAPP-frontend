import { useEffect, useDeferredValue, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import {
  actualizarPlantillaCorreo,
  enviarPruebaPlantillaCorreo,
  getPlantillaCorreo,
  type DatosPlantillaCorreo,
  type IdiomaPlantillaCorreo,
} from '../../api/plantillasCorreoService'
import { construirVistaPrevia, extraerVariables } from './vistaPrevia'
import { RUTA_PLANTILLAS } from './rutas'
import './PlantillasCorreo.css'

/** Edicion de una plantilla que el sistema ya envia: editor de HTML y vista renderizada. */
const PlantillaCorreoFormPage = () => {
  const navigate = useNavigate()
  const { plantillaId } = useParams<{ plantillaId: string }>()

  const [sigla, setSigla] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [asunto, setAsunto] = useState('')
  const [idioma, setIdioma] = useState<IdiomaPlantillaCorreo>('ES')
  const [contenidoHtml, setContenidoHtml] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [isEnviandoPrueba, setIsEnviandoPrueba] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const htmlDiferido = useDeferredValue(contenidoHtml)
  const vistaPrevia = useMemo(() => construirVistaPrevia(htmlDiferido), [htmlDiferido])
  const variables = useMemo(() => extraerVariables(`${asunto}\n${contenidoHtml}`), [asunto, contenidoHtml])

  useEffect(() => {
    if (!plantillaId) return
    getPlantillaCorreo(Number(plantillaId))
      .then((plantilla) => {
        setSigla(plantilla.sigla)
        setNombre(plantilla.nombre)
        setDescripcion(plantilla.descripcion)
        setAsunto(plantilla.asunto)
        setIdioma(plantilla.idioma)
        setContenidoHtml(plantilla.contenidoHtml)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No fue posible cargar la plantilla.'))
      .finally(() => setIsLoading(false))
  }, [plantillaId])

  const insertarEnCursor = (texto: string) => {
    const editor = editorRef.current
    if (!editor) {
      setContenidoHtml((actual) => actual + texto)
      return
    }
    const inicio = editor.selectionStart
    const fin = editor.selectionEnd
    setContenidoHtml(contenidoHtml.slice(0, inicio) + texto + contenidoHtml.slice(fin))
    requestAnimationFrame(() => {
      editor.focus()
      editor.setSelectionRange(inicio + texto.length, inicio + texto.length)
    })
  }

  const volver = () => navigate(RUTA_PLANTILLAS)

  const guardar = async () => {
    const datos: DatosPlantillaCorreo = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      asunto: asunto.trim(),
      idioma,
      contenidoHtml,
    }
    if (!datos.nombre || !datos.asunto || !datos.contenidoHtml.trim()) {
      setError('El nombre, el asunto y el contenido son obligatorios.')
      return
    }

    setIsGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      await actualizarPlantillaCorreo(Number(plantillaId), datos)
      navigate(RUTA_PLANTILLAS, { state: { mensaje: `La plantilla "${datos.nombre}" fue actualizada.` } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar la plantilla.')
    } finally {
      setIsGuardando(false)
    }
  }

  const enviarPrueba = async () => {
    setIsEnviandoPrueba(true)
    setError(null)
    setMensaje(null)
    try {
      setMensaje(await enviarPruebaPlantillaCorreo(Number(plantillaId)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible enviar el correo de prueba.')
    } finally {
      setIsEnviandoPrueba(false)
    }
  }

  return (
    <ModuleLayout title="Editar plantilla de correo">
      <section className="plantillas-correo">
        <header className="plantillas-correo__header">
          <p>
            Sigla <strong>{sigla}</strong>. La sigla no se puede cambiar porque el sistema la usa para enviar el correo.
            El correo de prueba envía la versión guardada: guarda antes de probar.
          </p>
        </header>

        {error ? <p className="plantillas-correo__alert plantillas-correo__alert--error" role="alert">{error}</p> : null}
        {mensaje ? <p className="plantillas-correo__alert plantillas-correo__alert--success" role="status">{mensaje}</p> : null}
        {isLoading ? <p className="plantillas-correo__status">Cargando plantilla...</p> : null}

        {!isLoading ? (
          <form className="plantillas-correo__form" onSubmit={(event) => { event.preventDefault(); void guardar() }}>
            <div className="plantillas-correo__campos">
              <label>
                Nombre
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>
              <label>
                Descripción
                <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Cuándo se envía este correo" />
              </label>
              <label>
                Asunto
                <input value={asunto} onChange={(e) => setAsunto(e.target.value)} />
              </label>
              <label>
                Idioma
                <select value={idioma} onChange={(e) => setIdioma(e.target.value as IdiomaPlantillaCorreo)}>
                  <option value="ES">Español</option>
                  <option value="EN">Inglés</option>
                </select>
              </label>
            </div>

            <div className="plantillas-correo__editor-vista">
              <div className="plantillas-correo__panel">
                <h2>Contenido</h2>
                <div className="plantillas-correo__herramientas" aria-label="Insertar en el contenido">
                  <span>Variables:</span>
                  {variables.length === 0 ? <span className="plantillas-correo__meta">ninguna</span> : null}
                  {variables.map((variable) => (
                    <button key={variable} type="button" className="plantillas-correo__chip" onClick={() => insertarEnCursor(`{{${variable}}}`)}>
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={editorRef}
                  className="plantillas-correo__editor"
                  value={contenidoHtml}
                  onChange={(e) => setContenidoHtml(e.target.value)}
                  spellCheck={false}
                  aria-label="Contenido HTML del correo"
                />
                <p className="plantillas-correo__meta">
                  No incluyas encabezado ni pie: el sistema los agrega automáticamente. Las variables se reemplazan por los datos reales en cada envío.
                </p>
              </div>

              <div className="plantillas-correo__panel">
                <h2>Vista previa</h2>
                <iframe className="plantillas-correo__vista" title="Vista previa del correo" sandbox="" srcDoc={vistaPrevia} />
                <p className="plantillas-correo__meta">Las variables aparecen resaltadas.</p>
              </div>
            </div>

            <div className="plantillas-correo__acciones-form">
              <button type="button" className="plantillas-correo__secondary" onClick={() => void enviarPrueba()} disabled={isGuardando || isEnviandoPrueba}>
                {isEnviandoPrueba ? 'Enviando prueba...' : 'Enviar correo de prueba'}
              </button>
              <button type="button" className="plantillas-correo__secondary" onClick={volver} disabled={isGuardando}>Cancelar</button>
              <button type="submit" className="plantillas-correo__primary" disabled={isGuardando}>
                {isGuardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default PlantillaCorreoFormPage
