import { fieldErrorMessage } from "@shared/lib/field-error"

export function FieldError({ errors, id }: { errors: readonly unknown[]; id?: string }) {
  const message = fieldErrorMessage(errors)
  return message ? (
    <p id={id} role="alert" className="mt-2 text-sm text-destructive">
      {message}
    </p>
  ) : null
}
