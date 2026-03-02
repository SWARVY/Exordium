import { useT } from "@shared/i18n"

import { useSignOut } from "../model/use-auth"

export function LogoutButton() {
  const { mutate: signOut, isPending } = useSignOut()
  const t = useT()

  return (
    <button
      type="button"
      onClick={() => signOut()}
      disabled={isPending}
      aria-label={t.action.logout}
      className="rounded-full px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      {isPending ? "..." : t.action.logout}
    </button>
  )
}
