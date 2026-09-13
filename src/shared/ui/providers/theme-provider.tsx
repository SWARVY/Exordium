import { COLOR_PALETTES, DEFAULT_PALETTE_ID } from "@shared/constants/themes"
import { createContext, useContext, useEffect, useState } from "react"

import type { ThemeMode } from "@shared/model/theme-schema"

interface ThemeContextValue {
  mode: ThemeMode
  paletteId: string
  setMode: (mode: ThemeMode) => void
  setPaletteId: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  paletteId: DEFAULT_PALETTE_ID,
  setMode: () => {},
  setPaletteId: () => {},
})

export function useThemeContext() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

function applyPalette(paletteId: string, mode: ThemeMode) {
  const palette = COLOR_PALETTES.find((p) => p.id === paletteId)
  if (!palette) return
  const root = document.documentElement
  const isDark = mode === "dark"

  root.style.setProperty("--primary", isDark ? palette.darkPrimary : palette.primary)
  root.style.setProperty("--primary-ink", isDark ? palette.darkPrimaryInk : palette.primaryInk)
  root.style.setProperty(
    "--primary-display",
    isDark ? palette.darkPrimary : (palette.primaryDisplay ?? palette.primary),
  )
  root.style.setProperty(
    "--primary-foreground",
    isDark ? palette.darkPrimaryForeground : palette.primaryForeground,
  )
  root.style.setProperty("--accent", isDark ? palette.darkAccent : palette.accent)
  root.style.setProperty(
    "--accent-foreground",
    isDark ? palette.darkAccentForeground : palette.accentForeground,
  )
  root.style.setProperty("--ring", isDark ? palette.darkRing : palette.ring)

  const j = palette.jikjo
  root.style.setProperty("--jikjo-menu-bg", isDark ? j.darkMenuBg : j.menuBg)
  root.style.setProperty("--jikjo-menu-shadow", isDark ? j.darkMenuShadow : j.menuShadow)
  root.style.setProperty("--jikjo-menu-item-text", isDark ? j.darkMenuItemText : j.menuItemText)
  root.style.setProperty(
    "--jikjo-menu-item-text-active",
    isDark ? j.darkMenuItemTextActive : j.menuItemTextActive,
  )
  root.style.setProperty(
    "--jikjo-menu-item-bg-active",
    isDark ? j.darkMenuItemBgActive : j.menuItemBgActive,
  )
  root.style.setProperty("--jikjo-menu-divider", isDark ? j.darkMenuDivider : j.menuDivider)
  root.style.setProperty("--jikjo-accent", isDark ? j.darkAccent : j.accent)
  root.style.setProperty("--jikjo-btn-text", isDark ? j.darkBtnText : j.btnText)
  root.style.setProperty("--jikjo-btn-bg-hover", isDark ? j.darkBtnBgHover : j.btnBgHover)
  root.style.setProperty("--jikjo-btn-text-hover", isDark ? j.darkBtnTextHover : j.btnTextHover)
  root.style.setProperty("--jikjo-btn-bg-active", isDark ? j.darkBtnBgActive : j.btnBgActive)
  root.style.setProperty("--jikjo-btn-text-active", isDark ? j.darkBtnTextActive : j.btnTextActive)
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>("light")
  const [paletteId, setPaletteIdState] = useState<string>(DEFAULT_PALETTE_ID)

  const [ready, setReady] = useState(false)

  useEffect(() => {
    let storedMode: string | null = null
    let storedPalette: string | null = null
    try {
      storedMode = localStorage.getItem("theme-mode")
      storedPalette = localStorage.getItem("theme-palette")
    } catch {
      /* Storage can be disabled by the browser. */
    }
    setModeState(
      storedMode === "dark" || storedMode === "light"
        ? storedMode
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
    )
    if (COLOR_PALETTES.some((palette) => palette.id === storedPalette)) {
      setPaletteIdState(storedPalette!)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    document.documentElement.classList.toggle("dark", mode === "dark")
    try {
      localStorage.setItem("theme-mode", mode)
      localStorage.setItem("theme-palette", paletteId)
    } catch {
      /* The selected theme still applies for this session. */
    }
    applyPalette(paletteId, mode)
  }, [mode, paletteId, ready])

  const setMode = (newMode: ThemeMode) => setModeState(newMode)
  const setPaletteId = (id: string) => setPaletteIdState(id)

  return (
    <ThemeContext.Provider value={{ mode, paletteId, setMode, setPaletteId }}>
      {children}
    </ThemeContext.Provider>
  )
}
