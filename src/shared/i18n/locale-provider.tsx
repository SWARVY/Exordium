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
    const stored = localStorage.getItem("locale")
    if (stored === "ko" || stored === "en" || stored === "ja") setLocaleState(stored)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("locale", l)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}
