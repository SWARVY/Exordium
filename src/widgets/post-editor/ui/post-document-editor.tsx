import { historyExtension, richTextExtension, type Extension } from "@jikjo/core"
import { createImageExtension } from "@jikjo/image"
import { EditorUI } from "@jikjo/ui-kit"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { postImageUploadAdapter } from "@shared/api/image-upload-adapter"
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  type EditorState,
  type LexicalEditor,
} from "lexical"
import { createElement, useCallback, useEffect, useMemo, useRef } from "react"

import { EnterSelectionSyncPlugin } from "./enter-selection-sync-plugin"

const DOCUMENT_RESTORE_TAG = "post-document-restore"
function consumeImageSlashCommand() {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return

  const paragraph = selection.anchor.getNode().getTopLevelElement()
  if (!$isParagraphNode(paragraph)) return

  const command = paragraph.getTextContent().trim().toLowerCase()
  if (!command.startsWith("/") || !"image".startsWith(command.slice(1))) return

  paragraph.clear().selectStart()
}

function createPostImageExtension(): Extension {
  const extension = createImageExtension({ uploadAdapter: postImageUploadAdapter })
  return {
    ...extension,
    slashMenuItems: extension.slashMenuItems?.map((item) =>
      item.id === "image"
        ? {
            ...item,
            onSelect: (editor) => {
              editor.update(consumeImageSlashCommand)
              item.onSelect(editor)
            },
          }
        : item,
    ),
  }
}

const baseExtensions: Extension[] = [
  richTextExtension,
  historyExtension,
  createPostImageExtension(),
]

interface PostDocumentEditorProps {
  initialDocument: string
  namespace: string
  label: string
  editable?: boolean
  onChange: (document: string) => void
  onLoadError: () => void
}

export function PostDocumentEditor({
  initialDocument,
  namespace,
  label,
  editable = true,
  onChange,
  onLoadError,
}: PostDocumentEditorProps) {
  const initialDocumentRef = useRef(initialDocument)
  const editorRef = useRef<LexicalEditor | null>(null)
  const labelRef = useRef(label)
  const onChangeRef = useRef(onChange)
  const onLoadErrorRef = useRef(onLoadError)
  labelRef.current = label
  onChangeRef.current = onChange
  onLoadErrorRef.current = onLoadError

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor, tags: Set<string>) => {
      if (tags.has(DOCUMENT_RESTORE_TAG)) return
      onChangeRef.current(JSON.stringify(editorState.toJSON()))
    },
    [],
  )

  useEffect(() => {
    editorRef.current?.getRootElement()?.setAttribute("aria-label", label)
  }, [label])

  const handleEditor = useCallback((editor: LexicalEditor) => {
    editorRef.current = editor
    editor.getRootElement()?.setAttribute("aria-label", labelRef.current)

    const document = initialDocumentRef.current
    if (!document) return
    try {
      const parsed = editor.parseEditorState(document)
      editor.setEditorState(parsed, { tag: DOCUMENT_RESTORE_TAG })
    } catch {
      onLoadErrorRef.current()
    }
  }, [])

  const extensions = useMemo<Extension[]>(
    () => [
      ...baseExtensions,
      {
        name: "post-document-change",
        plugins: [
          createElement(OnChangePlugin, { onChange: handleChange, ignoreSelectionChange: true }),
          createElement(EnterSelectionSyncPlugin),
        ],
      },
    ],
    [handleChange],
  )

  return (
    <EditorUI
      editable={editable}
      extensions={extensions}
      namespace={namespace}
      className="min-h-[360px] sm:min-h-[560px]"
      onEditor={handleEditor}
    />
  )
}
