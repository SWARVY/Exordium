import { createContext, useContext, useEffect, useState } from "react"

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

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem("locale", l)
    } catch {
      /* Keep the selection for this session. */
    }
  }

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}
