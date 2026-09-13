import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $createRangeSelectionFromDom,
  $getSelection,
  $isRangeSelection,
  $setSelection,
} from "lexical"
import { useEffect } from "react"

/** Keeps a rapid Enter from using a range selection that the DOM has already collapsed. */
export function EnterSelectionSyncPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.isComposing || editor.isComposing()) return

      const rootElement = event.currentTarget as HTMLElement
      if (event.target !== rootElement || editor.getRootElement() !== rootElement) return

      const domSelection = rootElement.ownerDocument.defaultView?.getSelection()
      const { anchorNode, focusNode } = domSelection ?? {}
      if (
        !domSelection?.isCollapsed ||
        !anchorNode ||
        !focusNode ||
        !rootElement.contains(anchorNode) ||
        !rootElement.contains(focusNode)
      )
        return

      editor.update(
        () => {
          const lexicalSelection = $getSelection()
          if (!$isRangeSelection(lexicalSelection) || lexicalSelection.isCollapsed()) return

          const synchronizedSelection = $createRangeSelectionFromDom(domSelection, editor)
          if (!synchronizedSelection) return

          synchronizedSelection.format = lexicalSelection.format
          synchronizedSelection.style = lexicalSelection.style
          $setSelection(synchronizedSelection)
        },
        { discrete: true },
      )
    }

    return editor.registerRootListener((rootElement, previousRootElement) => {
      previousRootElement?.removeEventListener("keydown", handleKeyDown, true)
      rootElement?.addEventListener("keydown", handleKeyDown, true)
    })
  }, [editor])

  return null
}
