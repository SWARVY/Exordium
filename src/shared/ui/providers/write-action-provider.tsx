import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

interface WriteActionContextValue {
  editing: boolean
  registerEditor: () => () => void
}

const WriteActionContext = createContext<WriteActionContextValue | null>(null)

export function WriteActionProvider({ children }: { children: React.ReactNode }) {
  const [editors, setEditors] = useState<Set<symbol>>(() => new Set())

  const registerEditor = useCallback(() => {
    const editor = Symbol("write-action-editor")
    setEditors((current) => new Set(current).add(editor))

    let registered = true
    return () => {
      if (!registered) return
      registered = false
      setEditors((current) => {
        const next = new Set(current)
        next.delete(editor)
        return next
      })
    }
  }, [])

  const value = useMemo(
    () => ({ editing: editors.size > 0, registerEditor }),
    [editors, registerEditor],
  )

  return <WriteActionContext.Provider value={value}>{children}</WriteActionContext.Provider>
}

function useWriteActionContext() {
  const context = useContext(WriteActionContext)
  if (!context) throw new Error("Write actions must be rendered inside WriteActionProvider.")
  return context
}

export function useWriteActionEditing(active = true) {
  const { registerEditor } = useWriteActionContext()

  useEffect(() => {
    if (!active) return
    return registerEditor()
  }, [active, registerEditor])
}

export function useIsWriteActionEditing() {
  return useWriteActionContext().editing
}
