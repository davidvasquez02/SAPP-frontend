import type { SolicitudDocumentoAdjunto } from '../types/solicitudDocumentosTypes'

const memoryCache = new Map<number, SolicitudDocumentoAdjunto[]>()

const getStorageKey = (solicitudId: number): string => `sapp:solicitudes:docs:${solicitudId}`

const canUseStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const safeClone = (docs: SolicitudDocumentoAdjunto[]): SolicitudDocumentoAdjunto[] => docs.map((doc) => ({ ...doc }))

export function loadSolicitudDocs(solicitudId: number): SolicitudDocumentoAdjunto[] {
  if (memoryCache.has(solicitudId)) {
    return safeClone(memoryCache.get(solicitudId) ?? [])
  }

  if (!canUseStorage()) {
    memoryCache.set(solicitudId, [])
    return []
  }

  const raw = window.localStorage.getItem(getStorageKey(solicitudId))
  if (!raw) {
    memoryCache.set(solicitudId, [])
    return []
  }

  try {
    const parsed = JSON.parse(raw) as SolicitudDocumentoAdjunto[]
    const validDocs = Array.isArray(parsed) ? parsed : []
    memoryCache.set(solicitudId, validDocs)
    return safeClone(validDocs)
  } catch {
    memoryCache.set(solicitudId, [])
    return []
  }
}

export function saveSolicitudDocs(solicitudId: number, docs: SolicitudDocumentoAdjunto[]): void {
  const nextDocs = safeClone(docs)
  memoryCache.set(solicitudId, nextDocs)

  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(getStorageKey(solicitudId), JSON.stringify(nextDocs))
}

export function upsertSolicitudDoc(solicitudId: number, doc: SolicitudDocumentoAdjunto): void {
  const current = loadSolicitudDocs(solicitudId)
  const next = current.some((item) => item.requirementId === doc.requirementId)
    ? current.map((item) => (item.requirementId === doc.requirementId ? { ...doc } : item))
    : [...current, { ...doc }]

  saveSolicitudDocs(solicitudId, next)
}

export function removeSolicitudDoc(solicitudId: number, requirementId: number): void {
  const current = loadSolicitudDocs(solicitudId)
  const next = current.filter((item) => item.requirementId !== requirementId)
  saveSolicitudDocs(solicitudId, next)
}

export function getSolicitudDoc(solicitudId: number, requirementId: number): SolicitudDocumentoAdjunto | null {
  const docs = loadSolicitudDocs(solicitudId)
  return docs.find((doc) => doc.requirementId === requirementId) ?? null
}
