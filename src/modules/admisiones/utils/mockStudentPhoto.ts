const EMPTY_PROFILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="Foto de perfil vacía">
  <rect width="160" height="160" fill="#E4E7EB"/>
  <circle cx="80" cy="58" r="28" fill="#B0B8C4"/>
  <path d="M24 144c4-30 28-48 56-48s52 18 56 48H24z" fill="#B0B8C4"/>
</svg>`

const EMPTY_PROFILE_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(EMPTY_PROFILE_SVG)}`

/**
 * DEV MOCK: URLs públicas temporales para fotos de aspirantes.
 * Se reemplazará cuando el backend entregue la foto real.
 */
export function getMockStudentPhotoUrl(
  _aspiranteId: number,
  _nombre?: string
): string {
  return EMPTY_PROFILE_DATA_URI
}
