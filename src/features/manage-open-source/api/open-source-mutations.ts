import { openSourceKeys } from "@entities/open-source/api/open-source-keys"
import { openSourceQueryOptions } from "@entities/open-source/api/open-source-query-options"
import { useT } from "@shared/i18n"
import { supabase } from "@shared/api/supabase-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { OpenSource, OpenSourceForm } from "@entities/open-source"

const listKey = () => openSourceKeys.lists()

function mapRow(row: Record<string, unknown>): OpenSource {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    repoUrl: row.repo_url as string,
    language: (row.language as string | null) ?? null,
    order: row.order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

async function createOpenSource(form: OpenSourceForm, currentList: OpenSource[]) {
  const nextOrder = currentList.length > 0 ? Math.max(...currentList.map((i) => i.order)) + 1 : 0

  const { data, error } = await supabase
    .from("open_source")
    .insert({
      name: form.name,
      description: form.description,
      repo_url: form.repoUrl,
      language: form.language || null,
      order: nextOrder,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

async function updateOpenSource({ id, form }: { id: string; form: OpenSourceForm }) {
  const { data, error } = await supabase
    .from("open_source")
    .update({
      name: form.name,
      description: form.description,
      repo_url: form.repoUrl,
      language: form.language || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function deleteOpenSource(id: string) {
  const { error } = await supabase.from("open_source").delete().eq("id", id)
  if (error) throw error
}

async function reorderOpenSource(items: { id: string; order: number }[]) {
  await Promise.all(
    items.map(({ id, order }) => supabase.from("open_source").update({ order }).eq("id", id)),
  )
}

export function useCreateOpenSource() {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: (form: OpenSourceForm) => {
      const currentList = queryClient.getQueryData<OpenSource[]>(listKey()) ?? []
      return createOpenSource(form, currentList)
    },
    onSuccess: (row) => {
      queryClient.setQueryData<OpenSource[]>(listKey(), (prev) =>
        [...(prev ?? []), mapRow(row)].sort((a, b) => a.order - b.order),
      )
      toast.success(t.toast.projectAdded)
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: listKey() })
      toast.error(t.toast.error)
    },
  })
}

export function useUpdateOpenSource() {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: updateOpenSource,
    onSuccess: (row) => {
      queryClient.setQueryData<OpenSource[]>(listKey(), (prev) =>
        (prev ?? []).map((item) => (item.id === row.id ? mapRow(row) : item)),
      )
      toast.success(t.toast.projectUpdated)
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: listKey() })
      toast.error(t.toast.error)
    },
  })
}

export function useDeleteOpenSource() {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: deleteOpenSource,
    onMutate: (id) => {
      const snapshot = queryClient.getQueryData<OpenSource[]>(listKey())
      queryClient.setQueryData<OpenSource[]>(listKey(), (prev) =>
        (prev ?? []).filter((item) => item.id !== id),
      )
      return { snapshot }
    },
    onSuccess: () => {
      toast.success(t.toast.projectDeleted)
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(listKey(), ctx.snapshot)
      toast.error(t.toast.error)
    },
  })
}

export function useReorderOpenSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reorderOpenSource,
    onError: () => {
      queryClient.invalidateQueries({ queryKey: openSourceQueryOptions.list().queryKey })
    },
  })
}
