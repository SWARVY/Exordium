import { useTheme } from "@features/change-theme"
import { COLOR_PALETTES } from "@shared/constants/themes"
import { useHydrated } from "@shared/hooks/use-hydrated"
import { useLocale, useT } from "@shared/i18n"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@shared/ui/components/dropdown-menu"
import { MoonIcon, SunIcon } from "lucide-react"

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
  const hydrated = useHydrated()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={!hydrated}
        className="flex size-11 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={t.theme.change}
      >
        {mode === "dark" ? (
          <MoonIcon className="size-4" aria-hidden="true" />
        ) : (
          <SunIcon className="size-4" aria-hidden="true" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuPositioner>
        <DropdownMenuContent>
          {/* Mode toggle */}
          <DropdownMenuItem
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            className="min-h-[44px] gap-2.5"
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
          <p className="px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {t.theme.color}
          </p>

          {/* Palettes */}
          <DropdownMenuRadioGroup
            value={paletteId}
            onValueChange={setPaletteId}
            aria-label={t.theme.color}
          >
            {COLOR_PALETTES.map((palette) => (
              <DropdownMenuRadioItem
                key={palette.id}
                value={palette.id}
                className="min-h-[44px] gap-2.5 font-mono text-sm"
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: palette.primary }}
                  aria-hidden="true"
                />
                {palette.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          {/* Divider */}
          <div className="my-1 -mx-1 h-px bg-border" />

          {/* Language section label */}
          <p className="px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {t.theme.language}
          </p>

          {/* Languages */}
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value) => setLocale(value as Locale)}
            aria-label={t.theme.language}
          >
            {LOCALES.map((loc) => (
              <DropdownMenuRadioItem
                key={loc.value}
                value={loc.value}
                className="min-h-[44px] gap-2.5 font-mono text-sm"
              >
                <span className="text-sm" aria-hidden="true">
                  {loc.flag}
                </span>
                {loc.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPositioner>
    </DropdownMenu>
  )
}
