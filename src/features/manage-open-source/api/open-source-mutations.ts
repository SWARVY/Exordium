import { openSourceKeys } from "@entities/open-source/api/open-source-keys"
import { openSourceQueryOptions } from "@entities/open-source/api/open-source-query-options"
import { supabase } from "@shared/api/supabase-client"
import { queryClient } from "@shared/lib/query-client"
import { useMutation } from "@tanstack/react-query"

import type { OpenSource, OpenSourceForm } from "@entities/open-source"

const listKey = () => openSourceKeys.lists()

function getList(): OpenSource[] {
  return queryClient.getQueryData<OpenSource[]>(listKey()) ?? []
}

function setList(updater: (prev: OpenSource[]) => OpenSource[]) {
  queryClient.setQueryData<OpenSource[]>(listKey(), (prev) => updater(prev ?? []))
}

async function createOpenSource(form: OpenSourceForm) {
  const current = getList()
  const nextOrder = current.length > 0 ? Math.max(...current.map((i) => i.order)) + 1 : 0

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

// DnD 순서 변경: { id, order }[] batch update
async function reorderOpenSource(items: { id: string; order: number }[]) {
  await Promise.all(
    items.map(({ id, order }) => supabase.from("open_source").update({ order }).eq("id", id)),
  )
}

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

export function useCreateOpenSource() {
  return useMutation({
    mutationFn: createOpenSource,
    onSuccess: (row) => {
      setList((prev) => [...prev, mapRow(row)].sort((a, b) => a.order - b.order))
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: listKey() })
    },
  })
}

export function useUpdateOpenSource() {
  return useMutation({
    mutationFn: updateOpenSource,
    onSuccess: (row) => {
      setList((prev) => prev.map((item) => (item.id === row.id ? mapRow(row) : item)))
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: listKey() })
    },
  })
}

export function useDeleteOpenSource() {
  return useMutation({
    mutationFn: deleteOpenSource,
    onMutate: (id) => {
      // optimistic: 즉시 목록에서 제거
      const snapshot = getList()
      setList((prev) => prev.filter((item) => item.id !== id))
      return { snapshot }
    },
    onError: (_err, _id, ctx) => {
      // 롤백
      if (ctx?.snapshot) queryClient.setQueryData(listKey(), ctx.snapshot)
    },
  })
}

export function useReorderOpenSource() {
  return useMutation({
    mutationFn: reorderOpenSource,
    // 순서 변경은 open-source-list.tsx에서 setQueryData로 즉시 반영하므로 여기선 에러 시만 복구
    onError: () => {
      queryClient.invalidateQueries({ queryKey: openSourceQueryOptions.list().queryKey })
    },
  })
}
