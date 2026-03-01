import { useT } from "@shared/i18n"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/components/dialog"
import { useState } from "react"

import { useCreateOpenSource, useUpdateOpenSource } from "../api/open-source-mutations"
import { OpenSourceForm } from "./open-source-form"

import type { OpenSource, OpenSourceForm as OpenSourceFormType } from "@entities/open-source"

interface OpenSourceFormDialogProps {
  mode: "create" | "edit"
  item?: OpenSource
}

export function OpenSourceFormDialog({ mode, item }: OpenSourceFormDialogProps) {
  const [open, setOpen] = useState(false)
  const t = useT()
  const { mutate: create, isPending: isCreating } = useCreateOpenSource()
  const { mutate: update, isPending: isUpdating } = useUpdateOpenSource()

  const isPending = isCreating || isUpdating

  const handleSubmit = (values: OpenSourceFormType) => {
    if (mode === "create") {
      create(values, { onSuccess: () => setOpen(false) })
    } else if (item) {
      update({ id: item.id, form: values }, { onSuccess: () => setOpen(false) })
    }
  }

  const defaultValues = item
    ? {
        name: item.name,
        description: item.description,
        repoUrl: item.repoUrl,
        language: item.language ?? "",
      }
    : undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            className={
              mode === "create"
                ? "rounded-full bg-primary px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
                : "rounded-full border border-border px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            }
          >
            {mode === "create" ? t.projectForm.addBtn : t.projectForm.editBtn}
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            {mode === "create" ? t.projectForm.addTitle : t.projectForm.editTitle}
          </DialogTitle>
        </DialogHeader>
        <OpenSourceForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
