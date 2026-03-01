import { useAuth } from "@shared/hooks/use-auth"
import { routes } from "@shared/constants/routes"
import { Navigate } from "@tanstack/react-router"

import type { ReactNode } from "react"

interface AuthGateProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * 로그인한 사용자에게만 children을 렌더링합니다.
 *
 * @example
 * <SignedIn>
 *   <UserMenu />
 * </SignedIn>
 */
export function SignedIn({ children, fallback = null }: AuthGateProps) {
  const { isSignedIn, isLoading } = useAuth()
  if (isLoading) return null
  return isSignedIn ? <>{children}</> : <>{fallback}</>
}

/**
 * 로그아웃 상태의 사용자에게만 children을 렌더링합니다.
 *
 * @example
 * <SignedOut>
 *   <LoginButton />
 * </SignedOut>
 */
export function SignedOut({ children, fallback = null }: AuthGateProps) {
  const { isSignedIn, isLoading } = useAuth()
  if (isLoading) return null
  return !isSignedIn ? <>{children}</> : <>{fallback}</>
}

interface RequireOwnerProps {
  children: ReactNode
  /** 리디렉션 대신 렌더링할 fallback. 지정하지 않으면 홈으로 리디렉션. */
  fallback?: ReactNode
}

/**
 * Owner 권한이 있는 사용자에게만 children을 렌더링합니다.
 * fallback 미지정 시 홈으로 리디렉션합니다.
 *
 * @example
 * <RequireOwner>
 *   <AdminPanel />
 * </RequireOwner>
 */
export function RequireOwner({ children, fallback }: RequireOwnerProps) {
  const { isOwner, isLoading } = useAuth()
  if (isLoading) return null
  if (!isOwner) {
    return fallback !== undefined ? <>{fallback}</> : <Navigate to={routes.home} replace />
  }
  return <>{children}</>
}
