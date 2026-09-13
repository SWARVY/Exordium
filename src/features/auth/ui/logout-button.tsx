import { useHydrated } from "@shared/hooks/use-hydrated"
import { useT } from "@shared/i18n"
import { LogOutIcon } from "lucide-react"

import { useSignOut } from "../model/use-auth"
import { AuthActionButton, type AuthButtonVariant } from "./auth-action-button"

export function LogoutButton({ variant = "default" }: { variant?: AuthButtonVariant }) {
  const { mutate: signOut, isPending } = useSignOut()
  const t = useT()
  const hydrated = useHydrated()

  return (
    <AuthActionButton
      variant={variant}
      icon={LogOutIcon}
      label={t.action.logout}
      pendingLabel={t.action.loading}
      isPending={isPending}
      onClick={() => signOut()}
      disabled={!hydrated}
    />
  )
}
