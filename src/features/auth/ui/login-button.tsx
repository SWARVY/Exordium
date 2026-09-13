import { useHydrated } from "@shared/hooks/use-hydrated"
import { useT } from "@shared/i18n"
import { LogInIcon } from "lucide-react"

import { useSignIn } from "../model/use-auth"
import { AuthActionButton, type AuthButtonVariant } from "./auth-action-button"

export function LoginButton({ variant = "default" }: { variant?: AuthButtonVariant }) {
  const { mutate: signIn, isPending } = useSignIn()
  const t = useT()
  const hydrated = useHydrated()

  return (
    <AuthActionButton
      variant={variant}
      icon={LogInIcon}
      label={t.action.login}
      pendingLabel={t.action.loading}
      isPending={isPending}
      onClick={() => signIn()}
      disabled={!hydrated}
    />
  )
}
