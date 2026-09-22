import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"

export type Locale = "ko" | "en" | "ja"

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: "ko",
  setLocale: () => {},
})

export function useLocale() {
  return useContext(LocaleContext)
}

interface LocaleProviderProps {
  children: React.ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>("ko")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("locale")
      if (stored === "ko" || stored === "en" || stored === "ja") setLocaleState(stored)
    } catch {
      /* Keep the default locale when storage is unavailable. */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem("locale", l)
    } catch {
      /* Keep the selection for this session. */
    }
  }, [])
  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
