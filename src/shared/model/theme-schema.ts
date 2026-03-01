import * as v from "valibot"

export const ThemeModeSchema = v.picklist(["light", "dark"])
export type ThemeMode = v.InferOutput<typeof ThemeModeSchema>

export const ThemeSchema = v.object({
  mode: ThemeModeSchema,
  paletteId: v.string(),
})
export type Theme = v.InferOutput<typeof ThemeSchema>
