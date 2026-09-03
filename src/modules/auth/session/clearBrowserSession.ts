const getCookiePaths = (): string[] => {
  const paths = window.location.pathname.split('/').reduce<string[]>((result, segment) => {
    if (!segment) return result
    return [...result, `${result.at(-1) ?? ''}/${segment}`]
  }, ['/'])

  return [...new Set([...paths, window.location.pathname])]
}

const getCookieDomains = (): string[] => {
  const hostnameParts = window.location.hostname.split('.')

  return hostnameParts.flatMap((_, index) => {
    const domain = hostnameParts.slice(index).join('.')
    return domain.includes('.') ? [domain, `.${domain}`] : [domain]
  })
}

const clearVisibleCookies = (): void => {
  const cookiePaths = getCookiePaths()
  const cookieDomains = getCookieDomains()

  document.cookie.split(';').forEach((cookie) => {
    const separatorIndex = cookie.indexOf('=')
    const name = (separatorIndex >= 0 ? cookie.slice(0, separatorIndex) : cookie).trim()
    if (!name) return

    cookiePaths.forEach((path) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=${path}`
      cookieDomains.forEach((domain) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=${path}; domain=${domain}`
      })
    })
  })
}

const clearCacheStorage = async (): Promise<void> => {
  if (!('caches' in window)) return
  const cacheNames = await window.caches.keys()
  await Promise.allSettled(cacheNames.map((cacheName) => window.caches.delete(cacheName)))
}

const clearIndexedDb = async (): Promise<void> => {
  if (!('indexedDB' in window) || typeof window.indexedDB.databases !== 'function') return
  const databases = await window.indexedDB.databases()

  await Promise.allSettled(
    databases.flatMap(({ name }) => {
      if (!name) return []
      return new Promise<void>((resolve) => {
        const request = window.indexedDB.deleteDatabase(name)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
        request.onblocked = () => resolve()
      })
    }),
  )
}

const unregisterServiceWorkers = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.allSettled(registrations.map((registration) => registration.unregister()))
}

/** Removes all browser-managed data accessible to the SPA for the current origin. */
export const clearBrowserSession = async (): Promise<void> => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  clearVisibleCookies()

  await Promise.allSettled([clearCacheStorage(), clearIndexedDb(), unregisterServiceWorkers()])

  // Avoid data written by an in-flight request while asynchronous cleanup was running.
  window.localStorage.clear()
  window.sessionStorage.clear()
  clearVisibleCookies()
}
