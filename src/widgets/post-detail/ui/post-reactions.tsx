import { reactionQueryOptions } from "@entities/reaction"
import { useTogglePostReaction } from "@features/toggle-reaction"
import { useT } from "@shared/i18n"
import { ReactionBar } from "@shared/ui/components/reaction-bar"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { useContext } from "react"

interface PostReactionsProps {
  postId: string
}

export function PostReactions({ postId }: PostReactionsProps) {
  const { session } = useContext(AuthContext)
  const userId = session?.user?.id

  const { data: summary } = useQuery(reactionQueryOptions.byPost(postId, userId))
  const { mutate: toggle } = useTogglePostReaction(postId, userId)
  const t = useT()

  if (!summary) return null

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="h-px w-12 bg-border" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
          {t.reaction.label}
        </span>
        <div className="h-px w-12 bg-border" />
      </div>
      <ReactionBar
        summary={summary}
        onToggle={
          userId ? (emoji) => toggle({ emoji, reacted: summary[emoji].reacted }) : undefined
        }
        disabled={!userId}
        centered
      />
      {!userId && (
        <p className="font-mono text-[9px] text-muted-foreground/40">{t.reaction.loginRequired}</p>
      )}
    </div>
  )
}
