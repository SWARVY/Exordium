import { Badge } from "@shared/ui/components/badge"

interface PostBadgeProps {
  tag: string
}

export function PostBadge({ tag }: PostBadgeProps) {
  return <Badge variant="secondary">{tag}</Badge>
}
