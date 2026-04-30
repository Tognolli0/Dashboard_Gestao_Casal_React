type CachedEnvelope<T> = {
  savedAt: number
  data: T
}

const PREFIX = 'minha-vida-cache:'

function getStorageKey(key: string) {
  return `${PREFIX}${key}`
}

export function readCachedValue<T>(key: string, maxAgeMs: number) {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(getStorageKey(key))
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedEnvelope<T>
    if (!parsed?.savedAt) return null

    if (Date.now() - parsed.savedAt > maxAgeMs) {
      window.localStorage.removeItem(getStorageKey(key))
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeCachedValue<T>(key: string, data: T) {
  if (typeof window === 'undefined') return

  try {
    const payload: CachedEnvelope<T> = {
      savedAt: Date.now(),
      data,
    }

    window.localStorage.setItem(getStorageKey(key), JSON.stringify(payload))
  } catch {
    // no-op
  }
}
