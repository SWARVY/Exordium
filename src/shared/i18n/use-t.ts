import { useContext } from "react"

import { LocaleContext } from "./locale-provider"
import { en } from "./locales/en"
import { ja } from "./locales/ja"
import { ko } from "./locales/ko"

const TRANSLATIONS = { ko, en, ja }

export function useT() {
  const { locale } = useContext(LocaleContext)
  return TRANSLATIONS[locale]
}
