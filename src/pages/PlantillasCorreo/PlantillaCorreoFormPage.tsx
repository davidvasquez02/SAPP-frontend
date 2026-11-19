import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ModuleLayout } from '../../components'
import {
  actualizarPlantillaCorreo,
  enviarPruebaPlantillaCorreo,
  getPlantillaCorreo,
  type DatosPlantillaCorreo,
  type IdiomaPlantillaCorreo,
  type PlantillaCorreo,
} from '../../api/plantillasCorreoService'
import { conDatosDeEjemplo, construirVistaPrevia, etiquetaVariable, extraerVariables } from './vistaPrevia'
import EditorMensajeCorreo from './EditorMensajeCorreo'
import { RUTA_PLANTILLAS } from './rutas'
import './PlantillasCorreo.css'

type Campo = keyof DatosPlantillaCorreo

const ETIQUETAS: Record<Campo, string> = {
  nombre: 'Nombre',
  asunto: 'Asunto',
  idioma: 'Idioma',
  descripcion: 'Descripción',
  contenidoHtml: 'Mensaje',
}

const NOMBRE_IDIOMA: Record<IdiomaPlantillaCorreo, string> = {
  ES: 'Español',
  EN: 'Inglés',
}

const CAMPOS_CORTOS: Campo[] = ['nombre', 'asunto', 'idioma']

const datosDe = (plantilla: PlantillaCorreo): DatosPlantillaCorreo => ({
  nombre: plantilla.nombre,
  descripcion: plantilla.descripcion,
  asunto: plantilla.asunto,
  idioma: plantilla.idioma,
  contenidoHtml: plantilla.contenidoHtml,
})

/** Edicion de una plantilla que el sistema ya envia. Cada campo se muestra en lectura hasta activar su edicion. */
const PlantillaCorreoFormPage = () => {
  const navigate = useNavigate()
  const { plantillaId } = useParams<{ plantillaId: string }>()

  const [original, setOriginal] = useState<PlantillaCorreo | null>(null)
  const [valores, setValores] = useState<DatosPlantillaCorreo | null>(null)
  const [editando, setEditando] = useState<Campo[]>([])
  const [confirmandoCambios, setConfirmandoCambios] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuardando, setIsGuardando] = useState(false)
  const [isEnviandoPrueba, setIsEnviandoPrueba] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const asuntoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!plantillaId) return
    getPlantillaCorreo(Number(plantillaId))
      .then((plantilla) => {
        setOriginal(plantilla)
        setValores(datosDe(plantilla))
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'No fue posible cargar la plantilla.'))
      .finally(() => setIsLoading(false))
  }, [plantillaId])

  const modificados: Campo[] = useMemo(() => {
    if (!original || !valores) return []
    return (Object.keys(ETIQUETAS) as Campo[]).filter((campo) => valores[campo] !== datosDe(original)[campo])
  }, [original, valores])

  const htmlDiferido = useDeferredValue(valores?.contenidoHtml ?? '')
  const vistaPrevia = useMemo(() => construirVistaPrevia(htmlDiferido), [htmlDiferido])
  const variables = useMemo(
    () => extraerVariables(`${original?.asunto ?? ''}\n${original?.contenidoHtml ?? ''}`),
    [original],
  )

  const pruebaBloqueadaPor = editando.length > 0
    ? 'Termina de editar los campos para enviar la prueba.'
    : modificados.length > 0
      ? 'Guarda los cambios para enviar la prueba.'
      : null

  const actualizar = (campo: Campo, valor: string) => {
    setValores((actual) => (actual ? { ...actual, [campo]: valor } : actual))
  }

  const iniciarEdicion = (campo: Campo) => {
    setMensaje(null)
    setEditando((actual) => [...actual, campo])
  }

  const terminarEdicion = (campo: Campo) => {
    setEditando((actual) => actual.filter((item) => item !== campo))
  }

  const cancelarEdicion = (campo: Campo) => {
    if (original) actualizar(campo, datosDe(original)[campo])
    terminarEdicion(campo)
  }

  const insertarDatoEnAsunto = (nombre: string) => {
    const input = asuntoRef.current
    if (!input || !variables.includes(nombre)) return
    const dato = `{{${nombre}}}`
    const inicio = input.selectionStart ?? input.value.length
    const fin = input.selectionEnd ?? inicio
    actualizar('asunto', input.value.slice(0, inicio) + dato + input.value.slice(fin))
    input.focus()
    requestAnimationFrame(() => input.setSelectionRange(inicio + dato.length, inicio + dato.length))
  }

  const intentarGuardar = () => {
    setError(null)
    setMensaje(null)
    if (editando.length > 0) {
      setError(`Termina la edición de: ${editando.map((campo) => ETIQUETAS[campo]).join(', ')}.`)
      return
    }
    if (modificados.length === 0) {
      setMensaje('No hay cambios para guardar.')
      return
    }
    setConfirmandoCambios(true)
  }

  const guardar = async () => {
    if (!valores || !original) return
    if (!valores.nombre.trim() || !valores.asunto.trim() || !valores.contenidoHtml.trim()) {
      setError('El nombre, el asunto y el contenido son obligatorios.')
      setConfirmandoCambios(false)
      return
    }
    setIsGuardando(true)
    setError(null)
    try {
      const datos: DatosPlantillaCorreo = {
        ...valores,
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion.trim(),
        asunto: valores.asunto.trim(),
      }
      const guardada = await actualizarPlantillaCorreo(original.id, datos)
      setOriginal(guardada)
      setValores(datosDe(guardada))
      setConfirmandoCambios(false)
      setMensaje('Cambios guardados correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar la plantilla.')
    } finally {
      setIsGuardando(false)
    }
  }

  const enviarPrueba = async () => {
    if (!original) return
    setIsEnviandoPrueba(true)
    setError(null)
    setMensaje(null)
    try {
      setMensaje(await enviarPruebaPlantillaCorreo(original.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible enviar el correo de prueba.')
    } finally {
      setIsEnviandoPrueba(false)
    }
  }

  const renderCampo = (campo: Campo) => {
    if (!valores) return null
    const modificado = modificados.includes(campo)
    const enEdicion = editando.includes(campo)
    const clases = [
      'plantillas-correo__campo',
      modificado ? 'plantillas-correo__campo--modificado' : '',
      enEdicion ? 'plantillas-correo__campo--editando' : '',
    ].filter(Boolean).join(' ')
    const valor = valores[campo]

    return (
      <div className={clases} key={campo}>
        <div className="plantillas-correo__campo-cabecera">
          <span className="plantillas-correo__campo-etiqueta">
            {ETIQUETAS[campo]}
            {modificado ? <em className="plantillas-correo__marca-modificado"> · modificado</em> : null}
          </span>
          {enEdicion ? (
            <div className="plantillas-correo__campo-botones">
              <button type="button" className="plantillas-correo__boton-campo" onClick={() => cancelarEdicion(campo)}>Cancelar</button>
              <button type="button" className="plantillas-correo__boton-campo plantillas-correo__boton-campo--principal" onClick={() => terminarEdicion(campo)}>Listo</button>
            </div>
          ) : (
            <button type="button" className="plantillas-correo__boton-campo" onClick={() => iniciarEdicion(campo)} disabled={isGuardando}>
              Editar
            </button>
          )}
        </div>

        {enEdicion ? (
          campo === 'idioma' ? (
            <select aria-label="Idioma" value={valor} onChange={(e) => actualizar('idioma', e.target.value)}>
              <option value="ES">Español</option>
              <option value="EN">Inglés</option>
            </select>
          ) : campo === 'descripcion' ? (
            <textarea aria-label="Descripción" rows={4} value={valor} onChange={(e) => actualizar('descripcion', e.target.value)} />
          ) : campo === 'contenidoHtml' ? (
            <EditorMensajeCorreo html={valor} variables={variables} onChange={(html) => actualizar('contenidoHtml', html)} />
          ) : campo === 'asunto' ? (
            <>
              <input ref={asuntoRef} aria-label="Asunto" value={valor} onChange={(e) => actualizar(campo, e.target.value)} />
              {variables.length > 0 && (
                <select aria-label="Insertar dato en el asunto" value="" onChange={(e) => insertarDatoEnAsunto(e.target.value)}>
                  <option value="" disabled>Insertar dato</option>
                  {variables.map((nombre) => <option key={nombre} value={nombre}>{etiquetaVariable(nombre)}</option>)}
                </select>
              )}
            </>
          ) : (
            <input aria-label={ETIQUETAS[campo]} value={valor} onChange={(e) => actualizar(campo, e.target.value)} />
          )
        ) : campo === 'contenidoHtml' ? (
          <p className="plantillas-correo__meta">Consulta el mensaje en la vista previa.</p>
        ) : (
          <p className="plantillas-correo__valor">{campo === 'idioma' ? NOMBRE_IDIOMA[valor as IdiomaPlantillaCorreo] : valor || '—'}</p>
        )}
      </div>
    )
  }

  return (
    <ModuleLayout title="Editar plantilla de correo">
      <section className="plantillas-correo">
        <header className="plantillas-correo__header">
          <p>Sigla <strong>{original?.sigla}</strong>. La sigla no se puede cambiar porque el sistema la usa para enviar el correo.</p>
        </header>


        {error ? <p className="plantillas-correo__alert plantillas-correo__alert--error" role="alert">{error}</p> : null}
        {mensaje ? <p className="plantillas-correo__alert plantillas-correo__alert--success" role="status">{mensaje}</p> : null}
        {isLoading ? <p className="plantillas-correo__status">Cargando plantilla...</p> : null}

        {!isLoading && valores ? (
          <div className="plantillas-correo__form">
            <div className="plantillas-correo__campos-cortos">
              {CAMPOS_CORTOS.map(renderCampo)}
            </div>

            {renderCampo('descripcion')}

            <div className="plantillas-correo__editor-vista">
              <div className="plantillas-correo__panel">
                {renderCampo('contenidoHtml')}
                <p className="plantillas-correo__nota" role="note">
                  El sistema completa los datos del destinatario y agrega el encabezado y el pie institucional al enviar.
                </p>
              </div>

              <div className="plantillas-correo__panel">
                <div className="plantillas-correo__campo-cabecera">
                  <span className="plantillas-correo__campo-etiqueta">Vista previa con datos de ejemplo</span>
                </div>
                <p className="plantillas-correo__valor"><strong>Asunto</strong> {conDatosDeEjemplo(valores.asunto)}</p>
                <iframe
                  className="plantillas-correo__vista"
                  title="Vista previa del correo"
                  sandbox="allow-same-origin"
                  srcDoc={vistaPrevia}
                />
              </div>
            </div>

            {confirmandoCambios ? (
              <div className="plantillas-correo__confirmacion" role="alert">
                <p><strong>Revisa los cambios antes de guardar:</strong></p>
                <ul>
                  {modificados.map((campo) => <li key={campo}>{ETIQUETAS[campo]}</li>)}
                </ul>
                <div className="plantillas-correo__acciones-form">
                  <button type="button" className="plantillas-correo__secondary" onClick={() => setConfirmandoCambios(false)} disabled={isGuardando}>
                    Seguir editando
                  </button>
                  <button type="button" className="plantillas-correo__primary" onClick={() => void guardar()} disabled={isGuardando}>
                    {isGuardando ? 'Guardando...' : 'Confirmar y guardar'}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="plantillas-correo__acciones-form">
              <button type="button" className="plantillas-correo__secondary" onClick={() => navigate(RUTA_PLANTILLAS)} disabled={isGuardando}>
                Volver al listado
              </button>
              <button
                type="button"
                className="plantillas-correo__secondary"
                onClick={() => void enviarPrueba()}
                disabled={pruebaBloqueadaPor !== null || isGuardando || isEnviandoPrueba}
                title={pruebaBloqueadaPor ?? 'Envía la versión guardada al correo de pruebas'}
              >
                {isEnviandoPrueba ? 'Enviando prueba...' : 'Enviar correo de prueba'}
              </button>
              <button
                type="button"
                className="plantillas-correo__primary"
                onClick={intentarGuardar}
                disabled={isGuardando || confirmandoCambios || editando.length > 0 || modificados.length === 0}
                title={editando.length > 0 ? 'Termina de editar todos los campos para guardar.' : 'No hay cambios para guardar.'}
              >
                Guardar
              </button>
            </div>
            {pruebaBloqueadaPor ? (
              <p className="plantillas-correo__bloqueo" role="status">
                <strong>Atención:</strong> {pruebaBloqueadaPor}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </ModuleLayout>
  )
}

export default PlantillaCorreoFormPage
