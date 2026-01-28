import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTiposDocumentoIdentificacion } from '../../api/tipoDocumentoIdentificacionService'
import type { TipoDocumentoIdentificacionDto } from '../../api/tipoDocumentoIdentificacionTypes'
import { useAuth } from '../../context/Auth'
import './AspiranteLoginPage.css'

const AspiranteLoginPage = () => {
  const { loginAspirante } = useAuth()
  const navigate = useNavigate()
  const [numeroInscripcion, setNumeroInscripcion] = useState('')
  const [tipoDocumentoId, setTipoDocumentoId] = useState<number | ''>('')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [tiposDoc, setTiposDoc] = useState<TipoDocumentoIdentificacionDto[]>([])
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadTiposDocumento = async () => {
      setLoadingTipos(true)
      setError(null)

      try {
        const data = await getTiposDocumentoIdentificacion()
        if (!isMounted) return

        setTiposDoc(data)
        setTipoDocumentoId((current) => current || data[0]?.id || '')
      } catch (loadError) {
        if (!isMounted) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No fue posible cargar los tipos de documento.',
        )
      } finally {
        if (isMounted) {
          setLoadingTipos(false)
        }
      }
    }

    loadTiposDocumento()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!numeroInscripcion.trim()) {
      setError('Número de inscripción requerido')
      return
    }

    if (!tipoDocumentoId) {
      setError('Tipo de documento requerido')
      return
    }

    if (!numeroDocumento.trim()) {
      setError('Número de documento requerido')
      return
    }

    console.log('[AspiranteLogin] params:', {
      numeroInscripcion,
      tipoDocumentoId,
      numeroDocumento,
    })

    setLoadingSubmit(true)

    try {
      await loginAspirante({
        numeroInscripcion: numeroInscripcion.trim(),
        tipoDocumentoId: Number(tipoDocumentoId),
        numeroDocumento: numeroDocumento.trim(),
      })
      console.log('[AspiranteLogin] login ok, session aspirante creada')
      navigate('/aspirante/documentos')
    } catch (loginError) {
      if (loginError instanceof Error) {
        setError(loginError.message)
      } else {
        setError('No fue posible validar los datos del aspirante.')
      }
    } finally {
      setLoadingSubmit(false)
    }
  }

  const isFormDisabled = loadingSubmit

  return (
    <div className="aspirante-login">
      <div className="aspirante-login__card">
        <h1 className="aspirante-login__title">Ingreso aspirante</h1>
        <p className="aspirante-login__subtitle">
          Digita tus datos de inscripción para continuar.
        </p>
        <form className="aspirante-login__form" onSubmit={handleSubmit}>
          <label className="aspirante-login__field">
            Número de inscripción
            <input
              type="text"
              name="numeroInscripcion"
              value={numeroInscripcion}
              onChange={(event) => setNumeroInscripcion(event.target.value)}
              placeholder="Ej: 202600001"
              disabled={isFormDisabled}
            />
          </label>
          <label className="aspirante-login__field">
            Tipo de documento
            <select
              name="tipoDocumentoId"
              value={tipoDocumentoId}
              onChange={(event) =>
                setTipoDocumentoId(event.target.value ? Number(event.target.value) : '')
              }
              disabled={loadingTipos || isFormDisabled}
            >
              <option value="" disabled>
                Selecciona un tipo de documento
              </option>
              {tiposDoc.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.codigoNombre}
                </option>
              ))}
            </select>
          </label>
          <label className="aspirante-login__field">
            Número de documento
            <input
              type="text"
              name="numeroDocumento"
              value={numeroDocumento}
              onChange={(event) => setNumeroDocumento(event.target.value)}
              placeholder="Ej: 123456789"
              disabled={isFormDisabled}
            />
          </label>
          {loadingTipos ? (
            <p className="aspirante-login__status">Cargando tipos de documento…</p>
          ) : null}
          {error ? <p className="aspirante-login__error">{error}</p> : null}
          <button type="submit" className="aspirante-login__primary" disabled={isFormDisabled}>
            {loadingSubmit ? 'Validando...' : 'Validar'}
          </button>
        </form>
        <button
          type="button"
          className="aspirante-login__back"
          onClick={() => navigate('/login')}
          disabled={isFormDisabled}
        >
          Volver
        </button>
      </div>
    </div>
  )
}

export default AspiranteLoginPage
