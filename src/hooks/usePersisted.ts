import { useEffect, useState } from 'react'

/**
 * State that survives a reload. Falls back to memory if storage is unavailable,
 * and to `initial` if what was stored no longer passes `accept` — a wheel from
 * an older version of the app should never break this one.
 */
export function usePersisted<T>(
  key: string,
  initial: T | (() => T),
  accept?: (value: unknown) => boolean,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw)
        if (!accept || accept(parsed)) return parsed as T
      }
    } catch {
      /* unreadable or malformed — fall through to the default */
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* private browsing, quota, or no storage at all — the wheel still works */
    }
  }, [key, value])

  return [value, setValue] as const
}
