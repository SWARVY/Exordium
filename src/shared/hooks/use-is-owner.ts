import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useContext } from "react"

export function useIsOwner(): boolean {
  const { session } = useContext(AuthContext)
  return session?.user?.app_metadata?.role === "owner"
}
