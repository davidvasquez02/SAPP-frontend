const DEFAULT_API_URL = '/api/sapp'

export const API_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_URL
export const API_BASE_URL = API_URL
