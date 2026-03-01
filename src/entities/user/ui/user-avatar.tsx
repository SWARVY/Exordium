import { cn } from "@shared/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@shared/ui/components/avatar"

interface UserAvatarProps {
  avatarUrl?: string | null
  githubLogin?: string | null
  name?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "size-6",
  md: "size-8",
  lg: "size-12",
}

function getAvvatarsUrl(githubLogin: string): string {
  return `https://avvvatars.com/api?uid=${githubLogin}&sq=true`
}

export function UserAvatar({
  avatarUrl,
  githubLogin,
  name,
  size = "md",
  className,
}: UserAvatarProps) {
  const src = avatarUrl ?? (githubLogin ? getAvvatarsUrl(githubLogin) : null)
  const fallback = (name?.[0] ?? "?").toUpperCase()

  return (
    <Avatar className={cn(sizeMap[size], className)}>
      {src && <AvatarImage src={src} alt={name ?? "avatar"} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
