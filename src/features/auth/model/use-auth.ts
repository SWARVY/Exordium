import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { signInWithGithub, signOut } from "../api/auth-mutations"

export function useSignIn() {
  const t = useT()
  return useMutation({
    mutationFn: signInWithGithub,
    onError: () => toast.error(t.authFlow.failed),
  })
}

export function useSignOut() {
  const t = useT()
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      window.location.assign(routes.home)
    },
    onError: () => toast.error(t.authFlow.logoutFailed),
  })
}
