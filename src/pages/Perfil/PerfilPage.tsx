import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ModuleLayout } from '../../components'
import { ROLES, hasAnyRole } from '../../auth/roleGuards'
import { useAuth } from '../../context/Auth'
import { imageDataUrl } from '../../shared/files/base64FileUtils'
import { formatRoleLabel } from '../../modules/auth/roles/roleUtils'
import {
  guardarFirmaUsuario,
  obtenerFirmaUsuario,
  type FirmaPerfil,
} from '../../modules/perfil/services/firmaPerfilService'
import './PerfilPage.css'

const MAX_SIGNATURE_SIZE = 2 * 1024 * 1024
const COORDINATION_PROGRAMS = [
  'MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA',
  'DOCTORADO EN CIENCIAS DE LA COMPUTACION',
] as const

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
  const [savedSignature, setSavedSignature] = useState<FirmaPerfil | null>(null)
  const [selectedSignature, setSelectedSignature] = useState<FirmaPerfil | null>(null)
  const [signatureTitle, setSignatureTitle] = useState('')
  const [isLoadingSignature, setIsLoadingSignature] = useState(true)
  const [isSavingSignature, setIsSavingSignature] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [photoFailed, setPhotoFailed] = useState(false)
  const roles = user?.roles ?? []
  const isCoordination = hasAnyRole(roles, [ROLES.COORDINACION, ROLES.ADMIN])
  const hasStudentRole = hasAnyRole(roles, [ROLES.ESTUDIANTE])
  const isStudent = hasStudentRole || Boolean(user?.estudiante)
  const personalEmail = user?.persona.emailPersonal ?? firstAttribute(user?.attributes, 'personalEmail')
  const phone = user?.persona.telefono ?? firstAttribute(user?.attributes, 'phone')
  const studentCode = user?.estudiante?.codigoEstudianteUis ?? firstAttribute(user?.attributes, 'studentCode')
  const academicProgram = user?.estudiante?.programaCodigoNombre ?? user?.programa
  const signature = selectedSignature ?? savedSignature
  const signatureSrc = signature
    ? `data:${signature.mimeType};base64,${signature.contenidoBase64}`
    : null
  const profilePhotoSrc = imageDataUrl(
    user?.estudiante?.foto?.contenidoBase64,
    user?.estudiante?.foto?.mimeType,
  )

  useEffect(() => {
    if (!user) return
    let active = true

    const loadSignature = async () => {
      setIsLoadingSignature(true)
      setError('')
      try {
        const currentSignature = await obtenerFirmaUsuario(user.id)
        if (!active || !currentSignature) return
        const match = currentSignature.contenidoFirma.match(/^data:([^;]+);base64,(.+)$/)
        setSavedSignature({
          nombreArchivo: 'firma-registrada',
          mimeType: match?.[1] ?? 'image/jpeg',
          contenidoBase64: match?.[2] ?? currentSignature.contenidoFirma,
        })
        setSignatureTitle(currentSignature.titulo)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No fue posible consultar la firma.')
      } finally {
        if (active) setIsLoadingSignature(false)
      }
    }

    void loadSignature()
    return () => { active = false }
  }, [user])

  const fullName = useMemo(() => {
    if (!user) return 'Usuario'
    return user.nombreCompleto || [user.persona.nombre1, user.persona.nombre2, user.persona.apellido1, user.persona.apellido2].filter(Boolean).join(' ')
  }, [user])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setMessage('')
    setError('')
    const file = event.target.files?.[0]
    if (!file) return
    if (!hasStudentRole && !signatureTitle.trim()) {
      setError('Ingresa el título que acompañará la firma.')
      event.target.value = ''
      return
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Selecciona una imagen PNG o JPG.')
      return
    }
    if (file.size > MAX_SIGNATURE_SIZE) {
      setError('La imagen no puede superar 2 MB.')
      return
    }
    try {
      const firma = await readFile(file)
      setSelectedSignature(firma)
      await saveSignature(firma)
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'No fue posible leer la imagen.')
    }
  }

  const saveSignature = async (firma: FirmaPerfil) => {
    if (!user) return

    setIsSavingSignature(true)
    setMessage('')
    setError('')

    try {
      await guardarFirmaUsuario(user.id, hasStudentRole ? undefined : signatureTitle, firma)
      setSavedSignature(firma)
      setSelectedSignature(null)
      setMessage('La firma se actualizó correctamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible guardar la firma.')
    } finally {
      setIsSavingSignature(false)
    }
  }

  const handleRetry = () => {
    if (selectedSignature) void saveSignature(selectedSignature)
  }

  if (!user) return null

  return (
    <ModuleLayout title="Mi perfil" showUserSummary={false}>
      <div className="profile-page">
        <section className="profile-page__hero" aria-label="Resumen del perfil">
          <div className="profile-page__photo-shell">
            {profilePhotoSrc && !photoFailed ? (
              <img
                className="profile-page__photo"
                src={profilePhotoSrc}
                alt={`Foto de perfil de ${fullName}`}
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <span className="profile-page__initials" aria-hidden="true">
                {fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="profile-page__hero-copy">
            <span className="profile-page__eyebrow">Cuenta institucional</span>
            <h1>{fullName}</h1>
            <p>
              {roles
                .filter((role) => role.toUpperCase() !== 'DEFAULT-ROLES-EISI')
                .map(formatRoleLabel)
                .join(' · ') || 'Usuario Minerva'}
            </p>
          </div>
        </section>

        <section className="profile-page__card" aria-labelledby="personal-title">
          <div className="profile-page__heading"><div><h2 id="personal-title">Información personal</h2><p>Datos asociados a tu identidad institucional.</p></div></div>
          <dl className="profile-page__data-grid">
            {!isCoordination && <div><dt>Tipo de documento</dt><dd>{user.persona.tipoDocumento}</dd></div>}
            {!isCoordination && <div><dt>Número de documento</dt><dd>{user.persona.numeroDocumento}</dd></div>}
            <div><dt>Correo institucional</dt><dd>{user.persona.emailInstitucional ?? user.email ?? 'No registrado'}</dd></div>
            {/* <div><dt>Usuario</dt><dd>{user.username}</dd></div> */}
            <div><dt>Correo personal</dt><dd>{personalEmail ?? 'No registrado'}</dd></div>
            <div><dt>Teléfono</dt><dd>{phone ?? 'No registrado'}</dd></div>
          </dl>
        </section>

        {isCoordination && <section className="profile-page__card" aria-labelledby="coord-title">
          <div className="profile-page__heading"><div><h2 id="coord-title">Información de coordinación</h2><p>Contexto académico disponible para tu rol.</p></div></div>
          <dl className="profile-page__data-grid">
            <div>
              <dt>Programa a cargo</dt>
              <dd>
                <ul className="profile-page__program-list">
                  {COORDINATION_PROGRAMS.map((program) => <li key={program}>{program}</li>)}
                </ul>
              </dd>
            </div>
            <div><dt>Unidad académica</dt><dd>Escuela de Ingeniería de Sistemas e Informática</dd></div>
            <div><dt>Estado de la cuenta</dt><dd>{user.activo ? 'Activa' : 'Inactiva'}</dd></div>
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
              {isLoadingSignature ? <span>Cargando firma…</span> : signatureSrc ? <img src={signatureSrc} alt="Vista previa de la firma" /> : <span>Sin firma cargada</span>}
            </div>
            <div className="profile-page__signature-actions">
              {!hasStudentRole && <label className="profile-page__title-field"><span>Título</span><input type="text" value={signatureTitle} onChange={(event) => setSignatureTitle(event.target.value)} placeholder="Ej. PhD." maxLength={100} disabled={isSavingSignature || isLoadingSignature} /></label>}
              <label className="profile-page__file-button">{isSavingSignature ? 'Guardando firma…' : signatureSrc ? 'Reemplazar imagen' : 'Seleccionar imagen'}<input type="file" accept="image/png,image/jpeg" onChange={handleFileChange} disabled={isSavingSignature || isLoadingSignature} /></label>
              <small>PNG o JPG, máximo 2 MB. Se recomienda fondo blanco.</small>
              {error && selectedSignature && <button type="button" onClick={handleRetry} disabled={isSavingSignature}>Reintentar carga</button>}
            </div>
          </div>
          {error && <p className="profile-page__feedback profile-page__feedback--error" role="alert">{error}</p>}
          {message && <p className="profile-page__feedback" role="status">{message}</p>}
        </section>
      </div>
    </ModuleLayout>
  )
}

export default PerfilPage
