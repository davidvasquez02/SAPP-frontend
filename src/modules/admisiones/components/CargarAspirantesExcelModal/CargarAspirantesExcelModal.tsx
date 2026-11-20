import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createAspirante, leerExcelAspirantes } from '../../api/aspiranteService'
import type { AspiranteExcelFilaDto } from '../../api/aspiranteCreateTypes'
import './CargarAspirantesExcelModal.css'

type EstadoFila = 'pendiente' | 'creando' | 'ok' | 'error'
type Fase = 'leyendo' | 'creando' | 'terminado' | 'fallo'

interface FilaProgreso {
  fila: AspiranteExcelFilaDto
  estado: EstadoFila
  /** Razón del fallo: la del Excel o la que respondió el backend al crear. */
  motivo: string | null
}

export interface ResultadoCargueAspirantes {
  creados: number
  fallidos: number
}

interface CargarAspirantesExcelModalProps {
  /** Excel elegido por el coordinador. Con null el modal está cerrado. */
  file: File | null
  convocatoriaAdmisionId: number | null
  /** Cupos que le quedan a la convocatoria; null si no tiene límite. Lo que exceda se marca como fallido. */
  cuposDisponibles: number | null
  onClose: () => void
  /** Se llama una sola vez, al terminar de crear, para que la pantalla refresque su listado. */
  onFinished: (resultado: ResultadoCargueAspirantes) => void
}

const nombreDe = (fila: AspiranteExcelFilaDto): string => {
  const apellidos = [fila.apellido1, fila.apellido2].filter(Boolean).join(' ')
  const nombres = [fila.nombre1, fila.nombre2].filter(Boolean).join(' ')
  const compuesto = [apellidos, nombres].filter(Boolean).join(', ')
  return compuesto || fila.nombreOriginal || `Fila ${fila.fila}`
}

const mensajeDe = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : 'No fue posible crear el aspirante.'

/**
 * Crea los aspirantes de un Excel uno por uno, mostrando el avance. El backend solo lee y valida el archivo; la
 * creación es una llamada por aspirante a POST /aspirante, así un aspirante que falla (documento repetido, correo
 * inválido...) queda marcado con ✗ y su razón, y no detiene a los demás.
 */
export const CargarAspirantesExcelModal = ({
  file,
  convocatoriaAdmisionId,
  cuposDisponibles,
  onClose,
  onFinished,
}: CargarAspirantesExcelModalProps) => {
  const [fase, setFase] = useState<Fase>('leyendo')
  const [filas, setFilas] = useState<FilaProgreso[]>([])
  const [programa, setPrograma] = useState('')
  const [errorLectura, setErrorLectura] = useState<string | null>(null)
  const procesadoRef = useRef<File | null>(null)
  const canceladoRef = useRef(false)
  const listaRef = useRef<HTMLOListElement | null>(null)

  // Props que el proceso necesita pero que no deben reiniciarlo si cambian mientras corre.
  const cuposRef = useRef(cuposDisponibles)
  const onFinishedRef = useRef(onFinished)
  useEffect(() => {
    cuposRef.current = cuposDisponibles
    onFinishedRef.current = onFinished
  }, [cuposDisponibles, onFinished])

  const actualizar = useCallback((indice: number, cambios: Partial<FilaProgreso>) => {
    setFilas((actuales) => actuales.map((item, i) => (i === indice ? { ...item, ...cambios } : item)))
  }, [])

  useEffect(() => {
    if (!file || procesadoRef.current === file) {
      return
    }
    procesadoRef.current = file
    canceladoRef.current = false

    const ejecutar = async () => {
      setFase('leyendo')
      setFilas([])
      setErrorLectura(null)

      if (!convocatoriaAdmisionId) {
        setErrorLectura('No se pudo determinar la convocatoria.')
        setFase('fallo')
        return
      }

      let lectura
      try {
        lectura = await leerExcelAspirantes(file, convocatoriaAdmisionId)
      } catch (error) {
        if (!canceladoRef.current) {
          setErrorLectura(mensajeDe(error))
          setFase('fallo')
        }
        return
      }
      if (canceladoRef.current) {
        return
      }

      // Las filas con errores en el Excel ya salen con ✗ y su razón, sin llamar al backend.
      const iniciales: FilaProgreso[] = lectura.filas.map((fila) => ({
        fila,
        estado: fila.errores.length > 0 ? 'error' : 'pendiente',
        motivo: fila.errores.length > 0 ? fila.errores.join('. ') : null,
      }))
      setPrograma(lectura.programaConvocatoria)
      setFilas(iniciales)
      setFase('creando')

      let creados = 0
      let fallidos = iniciales.filter((item) => item.estado === 'error').length

      for (let i = 0; i < iniciales.length; i++) {
        if (canceladoRef.current) {
          return
        }
        const { fila } = iniciales[i]
        if (iniciales[i].estado === 'error') {
          continue
        }

        const cupos = cuposRef.current
        if (cupos != null && creados >= cupos) {
          actualizar(i, { estado: 'error', motivo: 'La convocatoria alcanzó su cupo máximo de aspirantes.' })
          fallidos++
          continue
        }

        actualizar(i, { estado: 'creando' })
        try {
          await createAspirante({
            nombre1: fila.nombre1 ?? '',
            nombre2: fila.nombre2,
            apellido1: fila.apellido1 ?? '',
            apellido2: fila.apellido2,
            tipoDocumentoIdentificacionId: fila.tipoDocumentoIdentificacionId ?? 0,
            numeroDocumento: fila.numeroDocumento ?? '',
            emailPersonal: fila.emailPersonal ?? '',
            numeroInscripcionUis: fila.numeroInscripcionUis ?? '',
            telefono: fila.telefono,
            observaciones: null,
            programaId: fila.programaId ?? 0,
            convocatoriaAdmisionId,
          })
          actualizar(i, { estado: 'ok', motivo: null })
          creados++
        } catch (error) {
          actualizar(i, { estado: 'error', motivo: mensajeDe(error) })
          fallidos++
        }
      }

      if (!canceladoRef.current) {
        setFase('terminado')
        onFinishedRef.current({ creados, fallidos })
      }
    }

    void ejecutar()
  }, [file, convocatoriaAdmisionId, actualizar])

  // Si el modal se desmonta a media carga, no se siguen creando aspirantes. Al montar se rearma el indicador: en
  // desarrollo React monta, desmonta y vuelve a montar, y sin esto la carga quedaria cancelada desde el inicio.
  useEffect(() => {
    canceladoRef.current = false
    return () => {
      canceladoRef.current = true
    }
  }, [])

  const procesados = filas.filter((item) => item.estado === 'ok' || item.estado === 'error').length
  const creados = filas.filter((item) => item.estado === 'ok').length
  const fallidos = filas.filter((item) => item.estado === 'error')
  const enCurso = fase === 'leyendo' || fase === 'creando'

  // Mantiene a la vista el aspirante que se está creando.
  useEffect(() => {
    listaRef.current?.querySelector('[data-estado="creando"]')?.scrollIntoView({ block: 'nearest' })
  }, [filas])

  const cerrar = useCallback(() => {
    if (enCurso) {
      return
    }
    onClose()
  }, [enCurso, onClose])

  useEffect(() => {
    if (!file) {
      return
    }
    const alTeclear = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cerrar()
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [file, cerrar])

  const porcentaje = useMemo(
    () => (filas.length === 0 ? 0 : Math.round((procesados / filas.length) * 100)),
    [filas.length, procesados],
  )

  if (!file) {
    return null
  }

  return (
    <div className="cargar-aspirantes" role="presentation">
      <div className="cargar-aspirantes__backdrop" aria-hidden="true" onClick={cerrar} />
      <div className="cargar-aspirantes__dialog" role="dialog" aria-modal="true" aria-labelledby="cargar-aspirantes-title">
        <header className="cargar-aspirantes__header">
          <h2 id="cargar-aspirantes-title">Cargar aspirantes desde Excel</h2>
          <p>
            {file.name}
            {programa ? ` · ${programa}` : ''}
          </p>
        </header>

        {fase === 'leyendo' ? (
          <div className="cargar-aspirantes__estado" role="status" aria-live="polite">
            <span className="cargar-aspirantes__spinner" aria-hidden="true" />
            <strong>Leyendo el archivo…</strong>
          </div>
        ) : null}

        {fase === 'fallo' ? (
          <div className="cargar-aspirantes__estado" role="alert">
            <span className="cargar-aspirantes__icono cargar-aspirantes__icono--error" aria-hidden="true">✗</span>
            <strong>No fue posible leer el archivo</strong>
            <p>{errorLectura}</p>
            <button type="button" className="cargar-aspirantes__boton" onClick={onClose}>Cerrar</button>
          </div>
        ) : null}

        {fase === 'creando' || fase === 'terminado' ? (
          <>
            <div className="cargar-aspirantes__avance" role="status" aria-live="polite">
              <div className="cargar-aspirantes__avance-texto">
                <strong>{fase === 'creando' ? 'Creando aspirantes…' : 'Proceso terminado'}</strong>
                <span>{procesados} de {filas.length}</span>
              </div>
              <div
                className="cargar-aspirantes__barra"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={porcentaje}
              >
                <span style={{ width: `${porcentaje}%` }} />
              </div>
            </div>

            <ol className="cargar-aspirantes__lista" ref={listaRef}>
              {filas.map((item) => (
                <li key={item.fila.fila} className="cargar-aspirantes__fila" data-estado={item.estado}>
                  <span
                    className={`cargar-aspirantes__icono cargar-aspirantes__icono--${item.estado}`}
                    role="img"
                    aria-label={
                      item.estado === 'ok' ? 'Creado' : item.estado === 'error' ? 'No se pudo crear'
                        : item.estado === 'creando' ? 'Creando' : 'Pendiente'
                    }
                  >
                    {item.estado === 'ok' ? '✓' : item.estado === 'error' ? '✗' : item.estado === 'creando' ? '' : '•'}
                  </span>
                  <div>
                    <strong>{nombreDe(item.fila)}</strong>
                    <small>
                      Código {item.fila.numeroInscripcionUis || '—'} · Documento {item.fila.numeroDocumento || '—'}
                    </small>
                    {item.estado === 'error' && item.motivo ? (
                      <small className="cargar-aspirantes__motivo">{item.motivo}</small>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </div>

      {fase === 'terminado' ? (
        <div className="cargar-aspirantes__resultado-capa" role="presentation">
          <div
            className="cargar-aspirantes__resultado"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cargar-aspirantes-resultado-title"
          >
            <span
              className={`cargar-aspirantes__icono cargar-aspirantes__icono--grande cargar-aspirantes__icono--${creados > 0 ? 'ok' : 'error'}`}
              aria-hidden="true"
            >
              {creados > 0 ? '✓' : '✗'}
            </span>
            <h3 id="cargar-aspirantes-resultado-title">
              {creados > 0
                ? `Cargue exitoso de ${creados} aspirante${creados === 1 ? '' : 's'}`
                : 'No se creó ningún aspirante'}
            </h3>

            {fallidos.length > 0 ? (
              <div className="cargar-aspirantes__fallidos">
                <p>
                  {fallidos.length === 1
                    ? 'No se pudo crear 1 aspirante:'
                    : `No se pudieron crear ${fallidos.length} aspirantes:`}
                </p>
                <ul>
                  {fallidos.map((item) => (
                    <li key={item.fila.fila}>
                      <strong>{nombreDe(item.fila)}</strong>
                      <span>{item.motivo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button type="button" className="cargar-aspirantes__boton" onClick={onClose} autoFocus>
              Aceptar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
