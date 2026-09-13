import {
  OpenSourceFormSchema,
  type OpenSourceForm as OpenSourceFormType,
} from "@entities/open-source"
import { useT } from "@shared/i18n"
import { fieldErrorMessage } from "@shared/lib/field-error"
import { Button } from "@shared/ui/components/button"
import { FieldError } from "@shared/ui/components/field-error"
import { Input } from "@shared/ui/components/input"
import { Label } from "@shared/ui/components/label"
import { useForm } from "@tanstack/react-form"
import { useRef } from "react"

interface OpenSourceFormProps {
  defaultValues?: Partial<OpenSourceFormType>
  onSubmit: (values: OpenSourceFormType) => void
  isPending?: boolean
  onCancel?: () => void
}

const fieldLabelClass = "form-label"

export function OpenSourceForm({
  defaultValues,
  onSubmit,
  isPending,
  onCancel,
}: OpenSourceFormProps) {
  const t = useT()
  const formRef = useRef<HTMLFormElement>(null)
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
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit().then(() => {
          formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
        })
      }}
      className="flex flex-col gap-4"
    >
      <form.Field name="name">
        {(field) => {
          const errorId = `${field.name}-error`
          const invalid = Boolean(fieldErrorMessage(field.state.meta.errors))
          return (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name} className={fieldLabelClass}>
                {t.projectForm.name}
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t.projectForm.namePlaceholder}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
              />
              <FieldError errors={field.state.meta.errors} id={errorId} />
            </div>
          )
        }}
      </form.Field>

      <form.Field name="description">
        {(field) => {
          const errorId = `${field.name}-error`
          const invalid = Boolean(fieldErrorMessage(field.state.meta.errors))
          return (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name} className={fieldLabelClass}>
                {t.projectForm.desc}
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t.projectForm.descPlaceholder}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
              />
              <FieldError errors={field.state.meta.errors} id={errorId} />
            </div>
          )
        }}
      </form.Field>

      <form.Field name="repoUrl">
        {(field) => {
          const errorId = `${field.name}-error`
          const invalid = Boolean(fieldErrorMessage(field.state.meta.errors))
          return (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name} className={fieldLabelClass}>
                {t.projectForm.repoUrl}
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="https://github.com/..."
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
              />
              <FieldError errors={field.state.meta.errors} id={errorId} />
            </div>
          )
        }}
      </form.Field>

      <form.Field name="language">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={field.name} className={fieldLabelClass}>
              {t.projectForm.language}{" "}
              <span className="ml-1 font-normal text-muted-foreground">
                {t.projectForm.optional}
              </span>
            </Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="TypeScript"
            />
          </div>
        )}
      </form.Field>

      <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t.action.cancel}
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? t.action.saving : t.action.save}
        </Button>
      </div>
    </form>
  )
}
