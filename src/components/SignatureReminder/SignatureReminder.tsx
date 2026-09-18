import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/Auth'
import { obtenerFirmaUsuario } from '../../modules/perfil/services/firmaPerfilService'
import './SignatureReminder.css'

const SignatureReminder = () => {
  const { user } = useAuth()
  const [showReminder, setShowReminder] = useState(false)

  useEffect(() => {
    if (!user) return

    let active = true

    const checkSignature = async () => {
      try {
        const signature = await obtenerFirmaUsuario(user.id)
        if (active) setShowReminder(!signature)
      } catch {
        // A connectivity or authorization error must not be reported as a missing signature.
        if (active) setShowReminder(false)
      }
    }

    void checkSignature()

    return () => {
      active = false
    }
  }, [user])

  if (!showReminder) return null

  return (
    <aside className="signature-reminder" role="status" aria-live="polite">
      <span className="signature-reminder__icon" aria-hidden="true">✎</span>
      <div className="signature-reminder__content">
        <strong>Firma pendiente</strong>
        <p>
          Aún no has registrado tu firma.{' '}
          <Link to="/perfil" onClick={() => setShowReminder(false)}>
            Ingresa aquí para anexarla.
          </Link>
        </p>
      </div>
      <button
        className="signature-reminder__dismiss"
        type="button"
        aria-label="Cerrar recordatorio de firma"
        onClick={() => setShowReminder(false)}
      >
        ×
      </button>
    </aside>
  )
}

export default SignatureReminder
