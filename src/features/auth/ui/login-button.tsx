import { useT } from "@shared/i18n"
import { useSignIn } from "../model/use-auth"

export function LoginButton() {
  const { mutate: signIn, isPending } = useSignIn()
  const t = useT()

  return (
    <button
      type="button"
      onClick={() => signIn()}
      disabled={isPending}
      aria-label={t.action.login}
      className="rounded-full border border-border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
    >
      {isPending ? t.action.loading : t.action.login}
    </button>
  )
}
