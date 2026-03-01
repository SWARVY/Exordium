import * as v from "valibot"

export const REACTION_EMOJIS = ["👍", "❤️", "🔥", "💡", "😮"] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export const ReactionSchema = v.object({
  id: v.string(),
  userId: v.string(),
  emoji: v.picklist(REACTION_EMOJIS),
  createdAt: v.string(),
})

// 집계된 형태: emoji → { count, reacted }
export type ReactionSummary = Record<ReactionEmoji, { count: number; reacted: boolean }>

export type Reaction = v.InferOutput<typeof ReactionSchema>
