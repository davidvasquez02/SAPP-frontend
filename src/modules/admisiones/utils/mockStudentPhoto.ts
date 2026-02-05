const MOCK_PHOTOS = [
  'https://i.pravatar.cc/300?img=11',
  'https://i.pravatar.cc/300?img=12',
  'https://i.pravatar.cc/300?img=13',
  'https://i.pravatar.cc/300?img=14',
  'https://i.pravatar.cc/300?img=15',
  'https://i.pravatar.cc/300?img=16',
  'https://i.pravatar.cc/300?img=17',
  'https://i.pravatar.cc/300?img=18',
]

/**
 * DEV MOCK: URLs públicas temporales para fotos de aspirantes.
 * Se reemplazará cuando el backend entregue la foto real.
 */
export function getMockStudentPhotoUrl(
  aspiranteId: number,
  _nombre?: string
): string {
  const index = Math.abs(aspiranteId) % MOCK_PHOTOS.length
  return MOCK_PHOTOS[index]
}
