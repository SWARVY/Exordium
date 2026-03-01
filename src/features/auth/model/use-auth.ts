import { routes } from "@shared/constants/routes"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import { signInWithGithub, signOut } from "../api/auth-mutations"

export function useSignIn() {
  return useMutation({
    mutationFn: signInWithGithub,
  })
}

export function useSignOut() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      navigate({ to: routes.home, replace: true })
    },
  })
}
