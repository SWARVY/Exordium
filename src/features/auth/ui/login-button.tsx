import { useHydrated } from "@shared/hooks/use-hydrated"
import { useT } from "@shared/i18n"
import { LogInIcon } from "lucide-react"
import { useCallback } from "react"

import { useSignIn } from "../model/use-auth"
import { AuthActionButton, type AuthButtonVariant } from "./auth-action-button"

export function LoginButton({
  variant = "default",
  label,
}: {
  variant?: AuthButtonVariant
  label?: string
}) {
  const { mutate: signIn, isPending } = useSignIn()
  const t = useT()
  const hydrated = useHydrated()
  const handleClick = useCallback(() => signIn(), [signIn])

  return (
    <AuthActionButton
      variant={variant}
      icon={LogInIcon}
      label={label ?? t.action.login}
      pendingLabel={t.action.loading}
      isPending={isPending}
      onClick={handleClick}
      disabled={!hydrated}
    />
  )
}
