import { useT } from "@shared/i18n"
import { createElement, Fragment, type CSSProperties, type ReactNode } from "react"

interface ContentNode {
  type?: string
  text?: string
  children?: ContentNode[]
  format?: string | number
  tag?: string
  direction?: "ltr" | "rtl" | null
  indent?: number
  src?: string
  alt?: string
  caption?: string
  width?: number
  alignment?: string
}

function parseContent(content: string): ContentNode[] | null {
  try {
    const document = JSON.parse(content)
    return Array.isArray(document?.root?.children) ? document.root.children : null
  } catch {
    return null
  }
}

function contentText(node: ContentNode): string {
  if (!node || typeof node !== "object") return ""
  if (typeof node.text === "string") return node.text
  return Array.isArray(node.children) ? node.children.map(contentText).join(" ") : ""
}

export function estimateReadingTime(content: string): number {
  const text = (parseContent(content) ?? []).map(contentText).join(" ").trim()
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

function renderText(node: ContentNode): ReactNode {
  let text: ReactNode = typeof node.text === "string" ? node.text : ""
  const format = typeof node.format === "number" ? node.format : 0
  if (format & 1) text = <strong>{text}</strong>
  if (format & 2) text = <em>{text}</em>
  if (format & 4) text = <s>{text}</s>
  if (format & 8) text = <u>{text}</u>
  if (format & 16) text = <code>{text}</code>
  if (format & 32) text = <sub>{text}</sub>
  if (format & 64) text = <sup>{text}</sup>
  if (format & 128) text = <mark>{text}</mark>
  return text
}

function safeImageUrl(src: unknown): string | undefined {
  if (typeof src !== "string") return undefined
  try {
    const url = new URL(src, "https://content.invalid")
    return ["https:", "http:"].includes(url.protocol) ? src : undefined
  } catch {
    return undefined
  }
}

function renderNode(node: ContentNode): ReactNode {
  if (!node || typeof node !== "object") return null
  if (node.type === "text") return renderText(node)
  if (node.type === "linebreak") return <br />
  if (node.type === "tab") return "\t"
  const children = Array.isArray(node.children) ? node.children : []
  const rendered = children.map((child, index) => (
    // Parsed editor nodes do not carry IDs; order is semantic in this read-only renderer.
    // oxlint-disable-next-line react/no-array-index-key
    <Fragment key={index}>{renderNode(child)}</Fragment>
  ))
  // Each rendered node owns data-driven inline styles; sharing this object would change layout semantics.
  // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
  const style: CSSProperties = {
    textAlign: ["left", "center", "right", "justify", "start", "end"].includes(String(node.format))
      ? (node.format as CSSProperties["textAlign"])
      : undefined,
    paddingInlineStart:
      typeof node.indent === "number" && node.indent > 0
        ? `${Math.min(node.indent, 8) * 1.5}em`
        : undefined,
  }
  const dir = node.direction === "ltr" || node.direction === "rtl" ? node.direction : undefined

  switch (node.type) {
    case "root":
      return rendered
    case "heading": {
      const tag = /^h[1-6]$/.test(node.tag ?? "") ? node.tag! : "h2"
      return createElement(tag, { style, dir }, rendered)
    }
    case "quote":
      return (
        // The style is derived from the parsed node and cannot be shared between nodes.
        // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
        <blockquote style={style} dir={dir}>
          {rendered}
        </blockquote>
      )
    case "paragraph":
      return children.some((child) => child?.type === "image") ? (
        // The style is derived from the parsed node and cannot be shared between nodes.
        // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
        <div className="post-paragraph" style={style} dir={dir}>
          {rendered}
        </div>
      ) : (
        // The style is derived from the parsed node and cannot be shared between nodes.
        // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
        <p style={style} dir={dir}>
          {rendered.length ? rendered : <br />}
        </p>
      )
    case "image": {
      const src = safeImageUrl(node.src)
      if (!src) return null
      const width = typeof node.width === "number" && node.width > 0 ? node.width : undefined
      const alignment =
        node.alignment === "left" || node.alignment === "right" ? node.alignment : "center"
      // Image sizing and alignment are data-driven for each parsed node.
      // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop
      const figureStyle: CSSProperties = {
        width: width ?? "fit-content",
        marginInlineStart: alignment === "left" ? 0 : "auto",
        marginInlineEnd: alignment === "right" ? 0 : "auto",
      }
      return (
        <figure style={figureStyle}>
          <img
            src={src}
            alt={typeof node.alt === "string" ? node.alt : ""}
            width={width}
            decoding="async"
          />
          {typeof node.caption === "string" && node.caption && (
            <figcaption>{node.caption}</figcaption>
          )}
        </figure>
      )
    }
    default:
      return rendered.length ? rendered : typeof node.text === "string" ? node.text : null
  }
}

/** Renders the nodes registered by the Jikjo editor without mounting an editor for readers. */
export function PostContent({ content }: { content: string }) {
  const t = useT()
  const nodes = parseContent(content)
  if (!nodes)
    return (
      <p role="status" className="text-muted-foreground">
        {t.post.contentUnavailable}
      </p>
    )
  return (
    <div className="post-content">
      {nodes.map((node, index) => (
        // Parsed editor nodes do not carry IDs; order is semantic in this read-only renderer.
        // oxlint-disable-next-line react/no-array-index-key
        <Fragment key={index}>{renderNode(node)}</Fragment>
      ))}
    </div>
  )
}
