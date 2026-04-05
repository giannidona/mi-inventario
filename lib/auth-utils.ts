import type { User } from "@supabase/supabase-js"

/** Usuarios con email/contraseña (no anónimos) pueden subir ítems. */
export function canManageInventory(user: User | null | undefined): boolean {
  if (!user?.id) return false
  return user.is_anonymous !== true
}

export function displayUserName(user: User | null | undefined): string {
  if (!user) return ""
  const meta = user.user_metadata as { full_name?: string } | undefined
  const name = meta?.full_name?.trim()
  if (name) return name
  return user.email ?? "Usuario"
}
