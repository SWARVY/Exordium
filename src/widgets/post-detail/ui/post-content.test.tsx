import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PostContent } from "./post-content"

function renderNodes(children: unknown[]) {
  const html = renderToStaticMarkup(
    <PostContent content={JSON.stringify({ root: { type: "root", children } })} />,
  )
  return new DOMParser().parseFromString(html, "text/html")
}

describe("published post HTML", () => {
  it("includes headings, formatted text, quotes and line breaks before JavaScript runs", () => {
    const doc = renderNodes([
      { type: "heading", tag: "h2", children: [{ type: "text", text: "서버 렌더링" }] },
      {
        type: "paragraph",
        children: [
          { type: "text", text: "중요한 본문", format: 3 },
          { type: "linebreak" },
          { type: "text", text: "다음 줄" },
        ],
      },
      { type: "quote", children: [{ type: "text", text: "인용문" }] },
    ])
    expect(doc.querySelector("h2")?.textContent).toBe("서버 렌더링")
    expect(doc.querySelector("strong em, em strong")?.textContent).toBe("중요한 본문")
    expect(doc.querySelector("p br")).not.toBeNull()
    expect(doc.querySelector("blockquote")?.textContent).toBe("인용문")
    expect(doc.querySelector("[contenteditable]")).toBeNull()
  })

  it("preserves Jikjo image attributes and captions", () => {
    const doc = renderNodes([
      {
        type: "image",
        src: "https://example.com/photo.webp",
        alt: "풍경",
        caption: "직접 찍은 사진",
        width: 480,
        alignment: "right",
      },
    ])
    expect(doc.querySelector("img")?.getAttribute("src")).toBe("https://example.com/photo.webp")
    expect(doc.querySelector("img")?.alt).toBe("풍경")
    expect(doc.querySelector("img")?.width).toBe(480)
    expect(doc.querySelector("figcaption")?.textContent).toBe("직접 찍은 사진")
  })

  it("renders stored markup as text and rejects executable image URLs", () => {
    const doc = renderNodes([
      { type: "paragraph", children: [{ type: "text", text: "<script>alert(1)</script>" }] },
      { type: "image", src: "javascript:alert(1)", alt: "bad" },
    ])
    expect(doc.querySelector("script")).toBeNull()
    expect(doc.querySelector("p")?.textContent).toBe("<script>alert(1)</script>")
    expect(doc.querySelector("img")).toBeNull()
  })

  it("shows a recoverable message for malformed saved content", () => {
    const html = renderToStaticMarkup(<PostContent content="{broken" />)
    expect(html).toContain("본문을 표시할 수 없습니다")
  })

  it("keeps an image inside a paragraph in valid HTML without extra empty paragraphs", () => {
    const doc = renderNodes([
      {
        type: "paragraph",
        children: [{ type: "image", src: "https://example.com/photo.webp", alt: "inline image" }],
      },
    ])
    expect(doc.querySelectorAll("figure")).toHaveLength(1)
    expect(doc.querySelectorAll("p")).toHaveLength(0)
    expect(doc.querySelector("figure")?.parentElement?.tagName).toBe("DIV")
  })
})
