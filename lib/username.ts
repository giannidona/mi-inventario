const RESERVED = new Set([
  "api",
  "admin",
  "login",
  "auth",
  "www",
  "settings",
  "help",
  "app",
  "_next",
  "ingresar",
  "registro",
  "perfil",
  "buscar",
])

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@+/, "")
}

export function validateUsernameFormat(username: string): string | null {
  const u = normalizeUsername(username)
  if (u.length < 3 || u.length > 30) {
    return "El usuario debe tener entre 3 y 30 caracteres."
  }
  if (!/^[a-z0-9_]+$/.test(u)) {
    return "Solo letras minúsculas, números y guión bajo (_)."
  }
  if (RESERVED.has(u)) {
    return "Ese nombre no está disponible."
  }
  return null
}
