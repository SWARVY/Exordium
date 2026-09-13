export function fieldErrorMessage(errors: readonly unknown[]): string | null {
  for (const error of errors) {
    if (typeof error === "string" && error.trim()) return error
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message
    }
  }
  return null
}
