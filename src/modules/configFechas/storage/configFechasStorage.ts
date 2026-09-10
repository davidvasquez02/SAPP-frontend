const STORAGE_KEY = 'SAPP_CONFIG_FECHAS_ADMISIONES'

export type ConfigFechasItem = {
  periodoId: number
  periodoLabel: string
  tipoTramiteId: number
  fechaInicio: string
  fechaFin: string
  descripcion: string
  updatedAt: string
}

const sortByUpdatedAtDesc = (items: ConfigFechasItem[]) =>
  [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

export const loadConfigs = (): ConfigFechasItem[] => {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as ConfigFechasItem[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return sortByUpdatedAtDesc(parsed)
  } catch {
    return []
  }
}

const saveConfigs = (items: ConfigFechasItem[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortByUpdatedAtDesc(items)))
}

export const upsertConfig = (item: ConfigFechasItem): void => {
  const current = loadConfigs()
  const next = current.filter((config) => config.periodoId !== item.periodoId)
  next.unshift(item)
  saveConfigs(next)
}

export const getConfigByPeriodo = (periodoId: number): ConfigFechasItem | null => {
  return loadConfigs().find((item) => item.periodoId === periodoId) ?? null
}
