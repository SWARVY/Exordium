import { useTheme } from "@features/change-theme"
import { COLOR_PALETTES } from "@shared/constants/themes"
import { useLocale, useT } from "@shared/i18n"
import { cn } from "@shared/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@shared/ui/components/dropdown-menu"
import { CheckIcon, MoonIcon, SunIcon } from "lucide-react"

import type { Locale } from "@shared/i18n"

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "ko", label: "한국어", flag: "🇰🇷" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
]

export function ThemeSelector() {
  const { mode, paletteId, setMode, setPaletteId } = useTheme()
  const { locale, setLocale } = useLocale()
  const t = useT()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-8 items-center justify-center rounded-sm border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none"
        aria-label={t.theme.change}
      >
        {mode === "dark" ? <MoonIcon className="size-3.5" /> : <SunIcon className="size-3.5" />}
      </DropdownMenuTrigger>
      <DropdownMenuPositioner>
        <DropdownMenuContent>
          {/* Mode toggle */}
          <DropdownMenuItem
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            className="gap-2.5"
          >
            {mode === "dark" ? (
              <SunIcon className="size-3 text-muted-foreground" />
            ) : (
              <MoonIcon className="size-3 text-muted-foreground" />
            )}
            {mode === "dark" ? t.theme.light : t.theme.dark}
          </DropdownMenuItem>

          {/* Divider */}
          <div className="my-1 -mx-1 h-px bg-border" />

          {/* Palette section label */}
          <p className="px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
            {t.theme.color}
          </p>

          {/* Palettes */}
          {COLOR_PALETTES.map((palette) => (
            <DropdownMenuItem
              key={palette.id}
              onClick={() => setPaletteId(palette.id)}
              className={cn("gap-2.5", paletteId === palette.id && "text-foreground")}
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: palette.primary }}
                aria-hidden="true"
              />
              {palette.name}
              {paletteId === palette.id && <CheckIcon className="ml-auto size-3 text-foreground" />}
            </DropdownMenuItem>
          ))}

          {/* Divider */}
          <div className="my-1 -mx-1 h-px bg-border" />

          {/* Language section label */}
          <p className="px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
            {t.theme.language}
          </p>

          {/* Languages */}
          {LOCALES.map((loc) => (
            <DropdownMenuItem
              key={loc.value}
              onClick={() => setLocale(loc.value)}
              className={cn("gap-2.5", locale === loc.value && "text-foreground")}
            >
              <span className="text-sm" aria-hidden="true">
                {loc.flag}
              </span>
              {loc.label}
              {locale === loc.value && <CheckIcon className="ml-auto size-3 text-foreground" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPositioner>
    </DropdownMenu>
  )
}
