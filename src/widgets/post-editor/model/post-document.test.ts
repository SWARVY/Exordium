import { describe, expect, it } from "vitest"

import { validatePostDocument } from "./post-document"

function documentWith(children: unknown[]) {
  return JSON.stringify({ root: { type: "root", version: 1, children } })
}

describe("validatePostDocument", () => {
  it("accepts meaningful text and image documents", () => {
    expect(
      validatePostDocument(
        documentWith([{ type: "paragraph", children: [{ type: "text", text: "Article" }] }]),
      ),
    ).toBe("valid")
    expect(
      validatePostDocument(documentWith([{ type: "image", src: "https://example.test/a.png" }])),
    ).toBe("valid")
  })

  it("distinguishes empty documents from malformed serialization", () => {
    expect(validatePostDocument(documentWith([{ type: "paragraph", children: [] }]))).toBe("empty")
    expect(validatePostDocument("{broken")).toBe("invalid")
    expect(validatePostDocument(JSON.stringify({ root: { type: "root", children: {} } }))).toBe(
      "invalid",
    )
  })
})
