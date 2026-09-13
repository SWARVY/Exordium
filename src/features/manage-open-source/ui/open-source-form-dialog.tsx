import { useT } from "@shared/i18n"
import { Button } from "@shared/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/components/dialog"
import { PlusIcon, PencilIcon } from "lucide-react"
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
          <Button type="button" variant="outline" size="sm">
            {mode === "create" ? <PlusIcon /> : <PencilIcon />}
            {mode === "create" ? t.projectForm.addBtn : t.projectForm.editBtn}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle className="pr-8 text-xl font-bold tracking-tight text-foreground">
            {mode === "create" ? t.projectForm.addTitle : t.projectForm.editTitle}
          </DialogTitle>
        </DialogHeader>
        <OpenSourceForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isPending={isPending}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
