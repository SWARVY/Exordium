export type { ThemeMode } from "@shared/model/theme-schema"

export interface JikjoTheme {
  // Light mode
  menuBg: string
  menuShadow: string
  menuItemText: string
  menuItemTextActive: string
  menuItemBgActive: string
  menuDivider: string
  accent: string
  btnText: string
  btnBgHover: string
  btnTextHover: string
  btnBgActive: string
  btnTextActive: string
  // Dark mode
  darkMenuBg: string
  darkMenuShadow: string
  darkMenuItemText: string
  darkMenuItemTextActive: string
  darkMenuItemBgActive: string
  darkMenuDivider: string
  darkAccent: string
  darkBtnText: string
  darkBtnBgHover: string
  darkBtnTextHover: string
  darkBtnBgActive: string
  darkBtnTextActive: string
}

export interface ColorPalette {
  id: string
  name: string
  // Light mode
  primary: string
  primaryForeground: string
  accent: string
  accentForeground: string
  ring: string
  // Dark mode
  darkPrimary: string
  darkPrimaryForeground: string
  darkAccent: string
  darkAccentForeground: string
  darkRing: string
  // Editor (jikjo) theme
  jikjo: JikjoTheme
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "neutral",
    name: "Neutral",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",
    ring: "oklch(0.708 0 0)",
    darkPrimary: "oklch(0.922 0 0)",
    darkPrimaryForeground: "oklch(0.205 0 0)",
    darkAccent: "oklch(0.269 0 0)",
    darkAccentForeground: "oklch(0.985 0 0)",
    darkRing: "oklch(0.556 0 0)",
    jikjo: {
      // Light: clean white panel, zinc text tones, neutral accent
      menuBg: "#ffffff",
      menuShadow: "rgba(0, 0, 0, 0.12)",
      menuItemText: "#71717a",
      menuItemTextActive: "#18181b",
      menuItemBgActive: "rgba(228, 228, 231, 0.7)",
      menuDivider: "rgba(228, 228, 231, 0.8)",
      accent: "#52525b",
      btnText: "#71717a",
      btnBgHover: "rgba(228, 228, 231, 0.7)",
      btnTextHover: "#18181b",
      btnBgActive: "#18181b",
      btnTextActive: "#f4f4f5",
      // Dark: zinc-900 panel, zinc text tones, neutral accent
      darkMenuBg: "#18181b",
      darkMenuShadow: "rgba(0, 0, 0, 0.5)",
      darkMenuItemText: "#a1a1aa",
      darkMenuItemTextActive: "#f4f4f5",
      darkMenuItemBgActive: "rgba(63, 63, 70, 0.7)",
      darkMenuDivider: "rgba(82, 82, 91, 0.5)",
      darkAccent: "#a1a1aa",
      darkBtnText: "#a1a1aa",
      darkBtnBgHover: "rgba(63, 63, 70, 0.7)",
      darkBtnTextHover: "#e4e4e7",
      darkBtnBgActive: "rgba(255, 255, 255, 0.15)",
      darkBtnTextActive: "#ffffff",
    },
  },
  {
    id: "rose",
    name: "Rose",
    primary: "oklch(0.645 0.246 16.439)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.969 0.015 12.422)",
    accentForeground: "oklch(0.205 0 0)",
    ring: "oklch(0.645 0.246 16.439)",
    darkPrimary: "oklch(0.704 0.191 22.216)",
    darkPrimaryForeground: "oklch(0.145 0 0)",
    darkAccent: "oklch(0.269 0.02 16)",
    darkAccentForeground: "oklch(0.985 0 0)",
    darkRing: "oklch(0.645 0.246 16.439)",
    jikjo: {
      // Light: warm white panel, rose accent
      menuBg: "#fff5f5",
      menuShadow: "rgba(159, 18, 57, 0.1)",
      menuItemText: "#9f1239",
      menuItemTextActive: "#500724",
      menuItemBgActive: "rgba(254, 205, 211, 0.5)",
      menuDivider: "rgba(254, 205, 211, 0.8)",
      accent: "#e11d48",
      btnText: "#9f1239",
      btnBgHover: "rgba(254, 205, 211, 0.5)",
      btnTextHover: "#500724",
      btnBgActive: "#e11d48",
      btnTextActive: "#ffffff",
      // Dark: deep rose-tinted dark panel, rose accent
      darkMenuBg: "#1c0a0e",
      darkMenuShadow: "rgba(0, 0, 0, 0.5)",
      darkMenuItemText: "#fda4af",
      darkMenuItemTextActive: "#ffe4e6",
      darkMenuItemBgActive: "rgba(136, 19, 55, 0.4)",
      darkMenuDivider: "rgba(136, 19, 55, 0.5)",
      darkAccent: "#fb7185",
      darkBtnText: "#fda4af",
      darkBtnBgHover: "rgba(136, 19, 55, 0.4)",
      darkBtnTextHover: "#ffe4e6",
      darkBtnBgActive: "rgba(251, 113, 133, 0.25)",
      darkBtnTextActive: "#fb7185",
    },
  },
  {
    id: "violet",
    name: "Violet",
    primary: "oklch(0.606 0.25 292.717)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.96 0.018 272.314)",
    accentForeground: "oklch(0.205 0 0)",
    ring: "oklch(0.606 0.25 292.717)",
    darkPrimary: "oklch(0.702 0.183 292.717)",
    darkPrimaryForeground: "oklch(0.145 0 0)",
    darkAccent: "oklch(0.269 0.02 292)",
    darkAccentForeground: "oklch(0.985 0 0)",
    darkRing: "oklch(0.606 0.25 292.717)",
    jikjo: {
      // Light: cool white panel, violet accent
      menuBg: "#f5f3ff",
      menuShadow: "rgba(109, 40, 217, 0.1)",
      menuItemText: "#6d28d9",
      menuItemTextActive: "#3b0764",
      menuItemBgActive: "rgba(221, 214, 254, 0.5)",
      menuDivider: "rgba(221, 214, 254, 0.8)",
      accent: "#7c3aed",
      btnText: "#6d28d9",
      btnBgHover: "rgba(221, 214, 254, 0.5)",
      btnTextHover: "#3b0764",
      btnBgActive: "#7c3aed",
      btnTextActive: "#ffffff",
      // Dark: deep violet-tinted dark panel, violet accent
      darkMenuBg: "#0d0a1e",
      darkMenuShadow: "rgba(0, 0, 0, 0.5)",
      darkMenuItemText: "#c4b5fd",
      darkMenuItemTextActive: "#ede9fe",
      darkMenuItemBgActive: "rgba(91, 33, 182, 0.4)",
      darkMenuDivider: "rgba(91, 33, 182, 0.5)",
      darkAccent: "#a78bfa",
      darkBtnText: "#c4b5fd",
      darkBtnBgHover: "rgba(91, 33, 182, 0.4)",
      darkBtnTextHover: "#ede9fe",
      darkBtnBgActive: "rgba(167, 139, 250, 0.25)",
      darkBtnTextActive: "#a78bfa",
    },
  },
  {
    id: "teal",
    name: "Teal",
    primary: "oklch(0.6 0.118 184.704)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.953 0.051 180.801)",
    accentForeground: "oklch(0.205 0 0)",
    ring: "oklch(0.6 0.118 184.704)",
    darkPrimary: "oklch(0.696 0.17 162.48)",
    darkPrimaryForeground: "oklch(0.145 0 0)",
    darkAccent: "oklch(0.269 0.02 184)",
    darkAccentForeground: "oklch(0.985 0 0)",
    darkRing: "oklch(0.6 0.118 184.704)",
    jikjo: {
      // Light: cool teal-tinted white panel, teal accent
      menuBg: "#f0fdfa",
      menuShadow: "rgba(15, 118, 110, 0.1)",
      menuItemText: "#0f766e",
      menuItemTextActive: "#134e4a",
      menuItemBgActive: "rgba(153, 246, 228, 0.5)",
      menuDivider: "rgba(153, 246, 228, 0.8)",
      accent: "#0d9488",
      btnText: "#0f766e",
      btnBgHover: "rgba(153, 246, 228, 0.5)",
      btnTextHover: "#134e4a",
      btnBgActive: "#0d9488",
      btnTextActive: "#ffffff",
      // Dark: deep teal-tinted dark panel, teal accent
      darkMenuBg: "#061a18",
      darkMenuShadow: "rgba(0, 0, 0, 0.5)",
      darkMenuItemText: "#5eead4",
      darkMenuItemTextActive: "#ccfbf1",
      darkMenuItemBgActive: "rgba(13, 148, 136, 0.3)",
      darkMenuDivider: "rgba(13, 148, 136, 0.4)",
      darkAccent: "#2dd4bf",
      darkBtnText: "#5eead4",
      darkBtnBgHover: "rgba(13, 148, 136, 0.3)",
      darkBtnTextHover: "#ccfbf1",
      darkBtnBgActive: "rgba(45, 212, 191, 0.25)",
      darkBtnTextActive: "#2dd4bf",
    },
  },
  {
    id: "blue",
    name: "Blue",
    primary: "oklch(0.45 0.22 255)",
    primaryForeground: "oklch(0.985 0 0)",
    accent: "oklch(0.961 0.019 238)",
    accentForeground: "oklch(0.205 0 0)",
    ring: "oklch(0.45 0.22 255)",
    darkPrimary: "oklch(0.65 0.2 255)",
    darkPrimaryForeground: "oklch(0.145 0 0)",
    darkAccent: "oklch(0.269 0.02 255)",
    darkAccentForeground: "oklch(0.985 0 0)",
    darkRing: "oklch(0.65 0.2 255)",
    jikjo: {
      // Light: cool blue-tinted white panel, blue accent
      menuBg: "#eff6ff",
      menuShadow: "rgba(29, 78, 216, 0.1)",
      menuItemText: "#1d4ed8",
      menuItemTextActive: "#1e3a8a",
      menuItemBgActive: "rgba(191, 219, 254, 0.5)",
      menuDivider: "rgba(191, 219, 254, 0.8)",
      accent: "#2563eb",
      btnText: "#1d4ed8",
      btnBgHover: "rgba(191, 219, 254, 0.5)",
      btnTextHover: "#1e3a8a",
      btnBgActive: "#2563eb",
      btnTextActive: "#ffffff",
      // Dark: deep blue-tinted dark panel, blue accent
      darkMenuBg: "#060f1e",
      darkMenuShadow: "rgba(0, 0, 0, 0.5)",
      darkMenuItemText: "#93c5fd",
      darkMenuItemTextActive: "#dbeafe",
      darkMenuItemBgActive: "rgba(29, 78, 216, 0.3)",
      darkMenuDivider: "rgba(29, 78, 216, 0.4)",
      darkAccent: "#60a5fa",
      darkBtnText: "#93c5fd",
      darkBtnBgHover: "rgba(29, 78, 216, 0.3)",
      darkBtnTextHover: "#dbeafe",
      darkBtnBgActive: "rgba(96, 165, 250, 0.25)",
      darkBtnTextActive: "#60a5fa",
    },
  },
  {
    id: "amber",
    name: "Amber",
    primary: "oklch(0.769 0.188 70.08)",
    primaryForeground: "oklch(0.145 0 0)",
    accent: "oklch(0.987 0.022 95.277)",
    accentForeground: "oklch(0.205 0 0)",
    ring: "oklch(0.769 0.188 70.08)",
    darkPrimary: "oklch(0.828 0.189 84.429)",
    darkPrimaryForeground: "oklch(0.145 0 0)",
    darkAccent: "oklch(0.269 0.02 70)",
    darkAccentForeground: "oklch(0.985 0 0)",
    darkRing: "oklch(0.769 0.188 70.08)",
    jikjo: {
      // Light: warm amber-tinted white panel, amber accent
      menuBg: "#fffbeb",
      menuShadow: "rgba(180, 83, 9, 0.1)",
      menuItemText: "#b45309",
      menuItemTextActive: "#451a03",
      menuItemBgActive: "rgba(253, 230, 138, 0.5)",
      menuDivider: "rgba(253, 230, 138, 0.8)",
      accent: "#d97706",
      btnText: "#b45309",
      btnBgHover: "rgba(253, 230, 138, 0.5)",
      btnTextHover: "#451a03",
      btnBgActive: "#d97706",
      btnTextActive: "#ffffff",
      // Dark: deep amber-tinted dark panel, amber accent
      darkMenuBg: "#1a1000",
      darkMenuShadow: "rgba(0, 0, 0, 0.5)",
      darkMenuItemText: "#fcd34d",
      darkMenuItemTextActive: "#fef3c7",
      darkMenuItemBgActive: "rgba(180, 83, 9, 0.3)",
      darkMenuDivider: "rgba(180, 83, 9, 0.4)",
      darkAccent: "#fbbf24",
      darkBtnText: "#fcd34d",
      darkBtnBgHover: "rgba(180, 83, 9, 0.3)",
      darkBtnTextHover: "#fef3c7",
      darkBtnBgActive: "rgba(251, 191, 36, 0.25)",
      darkBtnTextActive: "#fbbf24",
    },
  },
]

export const DEFAULT_PALETTE_ID = "blue"
