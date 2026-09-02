import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ModuleLayout } from '../../components'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import {
  getFirmaPerfil,
  updateFirmaPerfil,
  type FirmaPerfil,
} from '../../modules/perfil/services/firmaPerfilService'
import './PerfilPage.css'

const MAX_SIGNATURE_SIZE = 2 * 1024 * 1024

const readFile = (file: File): Promise<FirmaPerfil> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      resolve({
        nombreArchivo: file.name,
        mimeType: file.type,
        contenidoBase64: result.split(',')[1] ?? '',
      })
    }
    reader.onerror = () => reject(new Error('No fue posible leer la imagen seleccionada.'))
    reader.readAsDataURL(file)
  })

const valueOrPending = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : 'Pendiente de integración'

const firstAttribute = (attributes: Record<string, string[]> | undefined, key: string) =>
  attributes?.[key]?.[0]?.trim() || null

const formatDateInColombia = (value: string | undefined) => {
  if (!value) return 'Pendiente de integración'

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'America/Bogota',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

const PerfilPage = () => {
  const { user } = useAuth()
  const [savedSignature, setSavedSignature] = useState<FirmaPerfil | null>(() =>
    user ? getFirmaPerfil(user.id) : null,
  )
  const [selectedSignature, setSelectedSignature] = useState<FirmaPerfil | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const roles = user?.roles ?? []
  const isCoordination = hasAnyRole(roles, [ROLES.COORDINACION, ROLES.ADMIN])
  const isStudent = roles.some((role) => role.toUpperCase() === 'ESTUDIANTE') || Boolean(user?.estudiante)
  const personalEmail = user?.persona.emailPersonal ?? firstAttribute(user?.attributes, 'personalEmail')
  const phone = user?.persona.telefono ?? firstAttribute(user?.attributes, 'phone')
  const studentCode = user?.estudiante?.codigoEstudianteUis ?? firstAttribute(user?.attributes, 'studentCode')
  const academicProgram = user?.estudiante?.programaCodigoNombre ?? user?.programa
  const signature = selectedSignature ?? savedSignature
  const signatureSrc = signature
    ? `data:${signature.mimeType};base64,${signature.contenidoBase64}`
    : null

  const fullName = useMemo(() => {
    if (!user) return 'Usuario'
    return user.nombreCompleto || [user.persona.nombre1, user.persona.nombre2, user.persona.apellido1, user.persona.apellido2].filter(Boolean).join(' ')
  }, [user])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setMessage('')
    setError('')
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Selecciona una imagen PNG o JPG.')
      return
    }
    if (file.size > MAX_SIGNATURE_SIZE) {
      setError('La imagen no puede superar 2 MB.')
      return
    }
    try {
      setSelectedSignature(await readFile(file))
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'No fue posible leer la imagen.')
    }
  }

  const handleUpdate = () => {
    if (!user || !selectedSignature) return
    updateFirmaPerfil(user.id, selectedSignature)
    setSavedSignature(selectedSignature)
    setSelectedSignature(null)
    setMessage('La firma se actualizó correctamente en este dispositivo.')
  }

  if (!user) return null

  return (
    <ModuleLayout title="Mi perfil">
      <div className="profile-page">
        <section className="profile-page__intro">
          <span className="profile-page__icon" aria-hidden="true">{fullName.charAt(0).toUpperCase()}</span>
          <div><h1>{fullName}</h1><p>{roles.filter((role) => role !== 'DEFAULT-ROLES-EISI').join(' · ') || 'Usuario SAPP'}</p></div>
        </section>

        <section className="profile-page__card" aria-labelledby="personal-title">
          <div className="profile-page__heading"><span aria-hidden="true">▣</span><div><h2 id="personal-title">Información personal</h2><p>Datos asociados a tu identidad institucional.</p></div></div>
          <dl className="profile-page__data-grid">
            <div><dt>Tipo de documento</dt><dd>{user.persona.tipoDocumento}</dd></div>
            <div><dt>Número de documento</dt><dd>{user.persona.numeroDocumento}</dd></div>
            <div><dt>Correo institucional</dt><dd>{user.persona.emailInstitucional ?? user.email ?? 'No registrado'}</dd></div>
            {/* <div><dt>Usuario</dt><dd>{user.username}</dd></div> */}
            <div><dt>Correo personal</dt><dd>{personalEmail ?? 'No registrado'}</dd></div>
            <div><dt>Teléfono</dt><dd>{phone ?? 'No registrado'}</dd></div>
          </dl>
        </section>

        {isCoordination && <section className="profile-page__card" aria-labelledby="coord-title">
          <div className="profile-page__heading"><div><h2 id="coord-title">Información de coordinación</h2><p>Contexto académico disponible para tu rol.</p></div></div>
          <dl className="profile-page__data-grid">
            <div><dt>Programa a cargo</dt><dd>{user.programa ?? 'Posgrados EISI (dato provisional)'}</dd></div>
            <div><dt>Unidad académica</dt><dd>Escuela de Ingeniería de Sistemas e Informática</dd></div>
            <div><dt>Estado de la cuenta</dt><dd>{user.activo ? 'Activa' : 'Inactiva'}</dd></div>
            <div><dt>Último ingreso</dt><dd>{user.lastLogin ?? 'Pendiente de integración'}</dd></div>
          </dl>
        </section>}

        {isStudent && <section className="profile-page__card" aria-labelledby="student-title">
          <div className="profile-page__heading"><div><h2 id="student-title">Información académica</h2><p>Resumen de tu vinculación como estudiante.</p></div></div>
          <dl className="profile-page__data-grid">
            <div><dt>Código UIS</dt><dd>{valueOrPending(studentCode)}</dd></div>
            <div><dt>Programa</dt><dd>{valueOrPending(academicProgram)}</dd></div>
            <div><dt>Cohorte</dt><dd>{valueOrPending(user.estudiante?.cohorte)}</dd></div>
            <div><dt>Estado académico</dt><dd>{valueOrPending(user.estudiante?.estado)}</dd></div>
            <div><dt>Fecha de ingreso</dt><dd>{formatDateInColombia(user.estudiante?.fechaIngreso)}</dd></div>
            {/* <div><dt>ID de estudiante</dt><dd>{valueOrPending(user.estudiante?.id)}</dd></div> */}
          </dl>
        </section>}

        <section className="profile-page__card profile-page__signature" aria-labelledby="signature-title">
          <div className="profile-page__heading"><span aria-hidden="true">✎</span><div><h2 id="signature-title">Firma</h2><p>Carga la imagen que se utilizará para firmar documentos autorizados.</p></div></div>
          <div className="profile-page__signature-content">
            <div className="profile-page__signature-preview">
              {signatureSrc ? <img src={signatureSrc} alt="Vista previa de la firma" /> : <span>Sin firma cargada</span>}
            </div>
            <div className="profile-page__signature-actions">
              <label className="profile-page__file-button">Seleccionar imagen<input type="file" accept="image/png,image/jpeg" onChange={handleFileChange} /></label>
              <small>PNG o JPG, máximo 2 MB. Se recomienda fondo blanco.</small>
              <button type="button" onClick={handleUpdate} disabled={!selectedSignature}>Actualizar firma</button>
            </div>
          </div>
          {error && <p className="profile-page__feedback profile-page__feedback--error" role="alert">{error}</p>}
          {message && <p className="profile-page__feedback" role="status">{message}</p>}
          <p className="profile-page__mock-note">Almacenamiento temporal local; se conectará al servicio documental cuando el endpoint esté disponible.</p>
        </section>
      </div>
    </ModuleLayout>
  )
}

export default PerfilPage
