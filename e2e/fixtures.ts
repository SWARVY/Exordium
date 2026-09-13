import { randomUUID } from "node:crypto"

import { test as base, expect } from "@playwright/test"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { appUrl, getLocalStack } from "../scripts/local-stack"

export { expect }
export interface Actor {
  id: string
  email: string
  password: string
}
interface Fixtures {
  database: SupabaseClient
  actors: { owner: Actor; reader: Actor; other: Actor }
  loginAs: (actor: Actor) => Promise<void>
  createPost: (
    values?: Record<string, unknown>,
  ) => Promise<{ id: string; slug: string; title: string; content: string }>
}

export const test = base.extend<Fixtures>({
  database: async ({}, use) => {
    const stack = getLocalStack()
    const client = createClient(stack.url, stack.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await use(client)
  },
  actors: async ({ database }, use) => {
    const created: Actor[] = []
    const make = async (role: string) => {
      const email = `${role}-${randomUUID()}@example.test`
      const password = `Local-${randomUUID()}`
      const { data, error } = await database.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: { full_name: `E2E ${role}`, user_name: `e2e-${role}` },
      })
      if (error) throw error
      const actor = { id: data.user.id, email, password }
      created.push(actor)
      return actor
    }
    try {
      await use({
        owner: await make("owner"),
        reader: await make("user"),
        other: await make("user"),
      })
    } finally {
      for (const actor of created) {
        const { error } = await database.auth.admin.deleteUser(actor.id)
        if (error) throw error
      }
    }
  },
  loginAs: async ({ context }, use) => {
    await use(async (actor) => {
      const stack = getLocalStack()
      await context.clearCookies()
      const { createServerClient } = await import("@supabase/ssr")
      const client = createServerClient(stack.url, stack.publishableKey, {
        cookies: {
          getAll: () => [],
          setAll: async (cookies) => {
            await context.addCookies(
              cookies
                .filter(({ value }) => value)
                .map(({ name, value }) => ({
                  name,
                  value,
                  url: appUrl,
                  sameSite: "Lax" as const,
                })),
            )
          },
        },
      })
      const { error } = await client.auth.signInWithPassword({
        email: actor.email,
        password: actor.password,
      })
      if (error) throw error
    })
  },
  createPost: async ({ database }, use) => {
    const ids: string[] = []
    await use(async (values = {}) => {
      const { data, error } = await database
        .from("posts")
        .insert({
          slug: `e2e-${randomUUID()}`,
          title: "E2E original article",
          description: "A local test article",
          content: JSON.stringify({
            root: {
              children: [
                {
                  children: [
                    {
                      type: "text",
                      text: "Original preserved body",
                      format: 0,
                      mode: "normal",
                      style: "",
                      detail: 0,
                      version: 1,
                    },
                  ],
                  direction: null,
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1,
                },
              ],
              direction: null,
              format: "",
              indent: 0,
              type: "root",
              version: 1,
            },
          }),
          published_at: new Date().toISOString(),
          ...values,
        })
        .select()
        .single()
      if (error) throw error
      ids.push(data.id)
      return data
    })
    for (const id of ids) {
      const { error } = await database.from("posts").delete().eq("id", id)
      if (error) throw error
    }
  },
})
