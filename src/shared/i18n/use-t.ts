import { useContext } from "react"

import { en } from "./locales/en"
import { ja } from "./locales/ja"
import { ko } from "./locales/ko"
import { LocaleContext } from "./locale-provider"

const TRANSLATIONS = { ko, en, ja }

export function useT() {
  const { locale } = useContext(LocaleContext)
  return TRANSLATIONS[locale]
}
