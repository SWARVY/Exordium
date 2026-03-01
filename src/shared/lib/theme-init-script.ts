import { COLOR_PALETTES, DEFAULT_PALETTE_ID } from "@shared/constants/themes"

/**
 * Returns an inline <script> string that runs synchronously before React hydration
 * to apply the stored theme (mode + palette) without flicker.
 */
export function getThemeInitScript(): string {
  const palettesJson = JSON.stringify(
    COLOR_PALETTES.map((p) => ({
      id: p.id,
      primary: p.primary,
      primaryForeground: p.primaryForeground,
      accent: p.accent,
      accentForeground: p.accentForeground,
      ring: p.ring,
      darkPrimary: p.darkPrimary,
      darkPrimaryForeground: p.darkPrimaryForeground,
      darkAccent: p.darkAccent,
      darkAccentForeground: p.darkAccentForeground,
      darkRing: p.darkRing,
      jikjo: p.jikjo,
    })),
  )

  return `(function(){
  var palettes = ${palettesJson};
  var defaultId = ${JSON.stringify(DEFAULT_PALETTE_ID)};
  var storedMode = localStorage.getItem('theme-mode');
  var storedPalette = localStorage.getItem('theme-palette');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var mode = (storedMode === 'dark' || storedMode === 'light') ? storedMode : (prefersDark ? 'dark' : 'light');
  var paletteId = storedPalette || defaultId;
  var palette = palettes.find(function(p){ return p.id === paletteId; }) || palettes.find(function(p){ return p.id === defaultId; });
  var root = document.documentElement;
  var isDark = mode === 'dark';
  if (isDark) root.classList.add('dark');
  if (!palette) return;
  root.style.setProperty('--primary', isDark ? palette.darkPrimary : palette.primary);
  root.style.setProperty('--primary-foreground', isDark ? palette.darkPrimaryForeground : palette.primaryForeground);
  root.style.setProperty('--accent', isDark ? palette.darkAccent : palette.accent);
  root.style.setProperty('--accent-foreground', isDark ? palette.darkAccentForeground : palette.accentForeground);
  root.style.setProperty('--ring', isDark ? palette.darkRing : palette.ring);
  var j = palette.jikjo;
  root.style.setProperty('--jikjo-menu-bg', isDark ? j.darkMenuBg : j.menuBg);
  root.style.setProperty('--jikjo-menu-shadow', isDark ? j.darkMenuShadow : j.menuShadow);
  root.style.setProperty('--jikjo-menu-item-text', isDark ? j.darkMenuItemText : j.menuItemText);
  root.style.setProperty('--jikjo-menu-item-text-active', isDark ? j.darkMenuItemTextActive : j.menuItemTextActive);
  root.style.setProperty('--jikjo-menu-item-bg-active', isDark ? j.darkMenuItemBgActive : j.menuItemBgActive);
  root.style.setProperty('--jikjo-menu-divider', isDark ? j.darkMenuDivider : j.menuDivider);
  root.style.setProperty('--jikjo-accent', isDark ? j.darkAccent : j.accent);
  root.style.setProperty('--jikjo-btn-text', isDark ? j.darkBtnText : j.btnText);
  root.style.setProperty('--jikjo-btn-bg-hover', isDark ? j.darkBtnBgHover : j.btnBgHover);
  root.style.setProperty('--jikjo-btn-text-hover', isDark ? j.darkBtnTextHover : j.btnTextHover);
  root.style.setProperty('--jikjo-btn-bg-active', isDark ? j.darkBtnBgActive : j.btnBgActive);
  root.style.setProperty('--jikjo-btn-text-active', isDark ? j.darkBtnTextActive : j.btnTextActive);
})()`
}
