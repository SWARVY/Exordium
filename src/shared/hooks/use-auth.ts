import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useContext } from "react"

/**
 * 현재 인증 상태를 반환하는 원스톱 훅.
 *
 * @example
 * const { session, isLoading, isSignedIn, isOwner } = useAuth()
 */
export function useAuth() {
  const { session, isLoading } = useContext(AuthContext)

  const isSignedIn = session !== null
  const isOwner = session?.user?.app_metadata?.role === "owner"
  const user = session?.user ?? null

  return {
    session,
    user,
    isLoading,
    isSignedIn,
    isOwner,
  }
}
