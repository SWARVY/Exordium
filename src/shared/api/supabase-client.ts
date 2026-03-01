import { env } from "@shared/config/env"
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(env.supabase.url, env.supabase.anonKey)
