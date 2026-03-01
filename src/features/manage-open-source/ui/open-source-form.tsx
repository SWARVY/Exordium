import {
  OpenSourceFormSchema,
  type OpenSourceForm as OpenSourceFormType,
} from "@entities/open-source"
import { useT } from "@shared/i18n"
import { Input } from "@shared/ui/components/input"
import { Label } from "@shared/ui/components/label"
import { useForm } from "@tanstack/react-form"

interface OpenSourceFormProps {
  defaultValues?: Partial<OpenSourceFormType>
  onSubmit: (values: OpenSourceFormType) => void
  isPending?: boolean
}

const fieldLabelClass = "font-mono text-xs uppercase tracking-widest text-muted-foreground"
const inputClass =
  "rounded-sm border-border bg-background font-mono text-sm focus-visible:border-primary focus-visible:ring-primary/20"

export function OpenSourceForm({ defaultValues, onSubmit, isPending }: OpenSourceFormProps) {
  const t = useT()
  const form = useForm({
    formId: "open-source-form",
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      repoUrl: defaultValues?.repoUrl ?? "",
      language: defaultValues?.language ?? "",
    },
    validators: { onSubmit: OpenSourceFormSchema },
    onSubmit: ({ value }) => onSubmit(value as OpenSourceFormType),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <form.Field name="name">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name} className={fieldLabelClass}>
              {t.projectForm.name}
            </Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t.projectForm.namePlaceholder}
              className={inputClass}
            />
            {field.state.meta.errors[0] && (
              <p className="font-mono text-xs text-destructive">
                {String(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name} className={fieldLabelClass}>
              {t.projectForm.desc}
            </Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t.projectForm.descPlaceholder}
              className={inputClass}
            />
            {field.state.meta.errors[0] && (
              <p className="font-mono text-xs text-destructive">
                {String(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="repoUrl">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name} className={fieldLabelClass}>
              {t.projectForm.repoUrl}
            </Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://github.com/..."
              className={inputClass}
            />
            {field.state.meta.errors[0] && (
              <p className="font-mono text-xs text-destructive">
                {String(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="language">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name} className={fieldLabelClass}>
              {t.projectForm.language}{" "}
              <span className="normal-case tracking-normal text-muted-foreground/50">{t.projectForm.optional}</span>
            </Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="TypeScript"
              className={inputClass}
            />
          </div>
        )}
      </form.Field>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-sm bg-primary py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? t.action.saving : t.action.save}
      </button>
    </form>
  )
}
