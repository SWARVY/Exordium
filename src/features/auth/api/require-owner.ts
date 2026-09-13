import { supabase } from "@shared/api/supabase-client"
import { routes } from "@shared/constants/routes"
import { redirect } from "@tanstack/react-router"

export async function requireOwner() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || user?.app_metadata?.role !== "owner") {
    throw redirect({ to: routes.home, replace: true })
  }
}
