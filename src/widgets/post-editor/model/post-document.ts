export type PostDocumentValidation = "valid" | "empty" | "invalid"

function inspectNode(node: unknown): { valid: boolean; hasContent: boolean } {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return { valid: false, hasContent: false }
  }
  const value = node as Record<string, unknown>
  if (typeof value.type !== "string") return { valid: false, hasContent: false }
  if (value.type === "text") {
    return {
      valid: typeof value.text === "string",
      hasContent: typeof value.text === "string" && value.text.trim().length > 0,
    }
  }
  if (value.type === "image") {
    return {
      valid: typeof value.src === "string" && value.src.length > 0,
      hasContent: typeof value.src === "string" && value.src.length > 0,
    }
  }
  if (value.children === undefined) return { valid: true, hasContent: false }
  if (!Array.isArray(value.children)) return { valid: false, hasContent: false }
  return value.children.reduce(
    (result, child) => {
      const inspected = inspectNode(child)
      return {
        valid: result.valid && inspected.valid,
        hasContent: result.hasContent || inspected.hasContent,
      }
    },
    { valid: true, hasContent: false },
  )
}

export function validatePostDocument(content: string): PostDocumentValidation {
  if (!content.trim()) return "empty"
  let document: unknown
  try {
    document = JSON.parse(content)
  } catch {
    return "invalid"
  }
  if (!document || typeof document !== "object" || Array.isArray(document)) return "invalid"
  const root = (document as Record<string, unknown>).root
  const inspected = inspectNode(root)
  if (!inspected.valid || (root as Record<string, unknown> | undefined)?.type !== "root") {
    return "invalid"
  }
  return inspected.hasContent ? "valid" : "empty"
}
