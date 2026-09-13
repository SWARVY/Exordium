import { ownerQueryOptions } from "@entities/owner"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useT } from "@shared/i18n"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { Skeleton } from "@shared/ui/components/skeleton"
import { useWriteActionEditing } from "@shared/ui/providers/write-action-provider"
import { useSuspenseQuery } from "@suspensive/react-query-5"
import { PencilIcon } from "lucide-react"
import { motion } from "motion/react"
import { lazy, Suspense, useState } from "react"

const OwnerProfileEditForm = lazy(() =>
  import("./owner-profile-edit-form").then(({ OwnerProfileEditForm }) => ({
    default: OwnerProfileEditForm,
  })),
)

function OwnerProfileContent() {
  const { data: profile } = useSuspenseQuery(ownerQueryOptions.profile())
  const isOwner = useIsOwner()
  const t = useT()
  const [isEditing, setIsEditing] = useState(false)
  useWriteActionEditing(isEditing)

  if (!profile) return null

  if (isEditing) {
    return (
      <div className="py-8">
        <Suspense fallback={<OwnerProfileEditSkeleton label={t.management.profileEditorLoading} />}>
          <OwnerProfileEditForm
            profile={profile}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        </Suspense>
      </div>
    )
  }

  const firstName = profile.name.split(" ")[0]

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative section-space flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-16"
    >
      {/* Avatar — chamfered + duotone */}
      <div className="duotone-wrap shrink-0 self-start">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="clip-chamfer size-24 object-cover sm:size-44"
            draggable={false}
          />
        ) : (
          <div className="clip-chamfer size-24 flex items-center justify-center bg-primary text-primary-foreground text-5xl font-black sm:size-44">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 sm:gap-5 min-w-0">
        {/* Greeting tag */}
        <span className="type-eyebrow text-primary-ink">— About me</span>

        {/* Giant headline */}
        <div>
          <h1 className="text-display break-words text-[clamp(2.5rem,10vw,6rem)] text-foreground">
            Hi, I'm
            <br />
            <span className="text-primary-display">{firstName}.</span>
          </h1>
        </div>

        {/* Bio */}
        <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          {profile.bio}
        </p>

        {/* Skills pills */}
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill: string) => (
              <span
                key={skill}
                className="rounded-sm border border-border px-3 py-1 font-mono text-sm font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Social links + edit */}
        <div className="flex items-center gap-4 pt-1">
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary-ink hover:underline"
            >
              GitHub ↗
            </a>
          )}
          {profile.twitterUrl && (
            <a
              href={profile.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary-ink hover:underline"
            >
              Twitter ↗
            </a>
          )}
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary-ink hover:underline"
            >
              Website ↗
            </a>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="ml-auto flex min-h-11 items-center gap-1.5 rounded-sm border-2 border-border px-3 py-1.5 text-sm font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary-ink"
            >
              <PencilIcon className="size-3" />
              {t.profile.editProfile}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function OwnerProfileEditSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-4 py-6">
      <Skeleton className="h-20 w-full rounded-sm" />
      <Skeleton className="h-11 w-full rounded-sm" />
      <Skeleton className="h-28 w-full rounded-sm" />
      <Skeleton className="h-11 w-full rounded-sm" />
    </div>
  )
}

export function OwnerProfileSkeleton() {
  return (
    <div className="section-space flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-16">
      <Skeleton className="clip-chamfer size-24 rounded-none sm:size-44" />
      <div className="flex flex-1 flex-col gap-5">
        <Skeleton className="h-3 w-20" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-64" />
          <Skeleton className="h-14 w-48" />
        </div>
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="h-5 w-3/4 max-w-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function OwnerProfile() {
  return (
    <AsyncBoundary fallback={<OwnerProfileSkeleton />}>
      <OwnerProfileContent />
    </AsyncBoundary>
  )
}
