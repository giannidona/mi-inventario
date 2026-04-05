"use client"

import { useState, useEffect } from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { checkUsernameAvailable } from "@/lib/inventory-supabase"
import { normalizeUsername, validateUsernameFormat } from "@/lib/username"

type Mode = "signin" | "signup"

interface InventoryAuthSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supabase: SupabaseClient
  initialMode?: Mode
  onAuthSuccess?: (username: string) => void
}

export function InventoryAuthSheet({
  open,
  onOpenChange,
  supabase,
  initialMode = "signin",
  onAuthSuccess,
}: InventoryAuthSheetProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [handle, setHandle] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setMode(initialMode)
  }, [open, initialMode])

  const resetFields = () => {
    setHandle("")
    setName("")
    setEmail("")
    setPassword("")
    setConfirm("")
  }

  function resolveUsernameForRedirect(user: User): string | null {
    const meta = user.user_metadata
    const fromMeta =
      typeof meta?.username === "string" ? normalizeUsername(meta.username) : ""
    if (fromMeta && !validateUsernameFormat(fromMeta)) {
      return fromMeta
    }
    return null
  }

  async function finishAuthAndRedirect(user: User | null) {
    if (!user) return
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()
    if (profErr) {
      console.error(profErr)
    }
    const fromRow = prof?.username?.trim()
      ? normalizeUsername(prof.username)
      : null
    const slug =
      fromRow && !validateUsernameFormat(fromRow)
        ? fromRow
        : resolveUsernameForRedirect(user)
    if (slug) {
      onAuthSuccess?.(slug)
      return
    }
    toast.error(
      "Iniciaste sesión, pero esta cuenta no tiene un @ de inventario. Si es una cuenta vieja, creá la fila en la tabla profiles en Supabase o registrate de nuevo con un usuario."
    )
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetFields()
    onOpenChange(next)
  }

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      toast.error("Email y contraseña son obligatorios.")
      return
    }
    setLoading(true)
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      toast.success("Sesión iniciada.")
      await finishAuthAndRedirect(signInData.user ?? null)
      resetFields()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo iniciar sesión.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    const userSlug = normalizeUsername(handle)
    const fmtErr = validateUsernameFormat(userSlug)
    if (fmtErr) {
      toast.error(fmtErr)
      return
    }
    if (!name.trim()) {
      toast.error("Indica tu nombre.")
      return
    }
    if (!email.trim() || !password) {
      toast.error("Email y contraseña son obligatorios.")
      return
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.")
      return
    }
    setLoading(true)
    try {
      const available = await checkUsernameAvailable(supabase, userSlug)
      if (!available) {
        toast.error("Ese usuario ya está en uso. Probá otro.")
        setLoading(false)
        return
      }
      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            username: userSlug,
          },
          emailRedirectTo: origin ? `${origin}/` : undefined,
        },
      })
      if (error) throw error
      if (data.session) {
        toast.success("Cuenta creada. Tu inventario es público en tu enlace.")
        await finishAuthAndRedirect(data.user ?? null)
        resetFields()
        onOpenChange(false)
      } else {
        toast.success(
          "Revisa tu correo para confirmar. Después entrá con tu usuario y contraseña."
        )
        resetFields()
        onOpenChange(false)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la cuenta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] rounded-t-[20px] border-none bg-[#FFFFFF] px-6 pb-8 md:left-auto md:right-4 md:bottom-4 md:max-w-md md:rounded-xl md:border md:border-[#F0F0F0] md:shadow-xl"
      >
        <SheetHeader className="space-y-1 pb-4 text-left">
          <SheetTitle className="text-lg font-semibold text-[#000000]">
            {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
          </SheetTitle>
          <SheetDescription className="text-xs text-[#888888]">
            Registrate con un usuario único: tu inventario será público en /tuusuario.
          </SheetDescription>
        </SheetHeader>

        <div className="mb-4 flex gap-2 rounded-md bg-[#F5F5F5] p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={cn(
              "flex-1 rounded-sm py-2 text-xs font-medium transition-colors",
              mode === "signin"
                ? "bg-[#000000] text-[#FFFFFF]"
                : "text-[#888888]"
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "flex-1 rounded-sm py-2 text-xs font-medium transition-colors",
              mode === "signup"
                ? "bg-[#000000] text-[#FFFFFF]"
                : "text-[#888888]"
            )}
          >
            Registrarse
          </button>
        </div>

        <div className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="mb-1.5 block text-xs text-[#888888]">
                  Usuario (tu enlace)
                </label>
                <div className="flex items-center gap-1 rounded-none border border-[#E8E8E8] bg-[#FFFFFF] px-3 text-sm">
                  <span className="shrink-0 text-[#888888]">/</span>
                  <Input
                    value={handle}
                    onChange={(e) =>
                      setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    autoComplete="username"
                    placeholder="giannidona"
                    className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#AAAAAA]">
                  Solo minúsculas, números y _. Entre 3 y 30 caracteres.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#888888]">Nombre</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Tu nombre"
                  className="rounded-none border-[#E8E8E8] bg-[#FFFFFF] text-sm text-[#000000]"
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1.5 block text-xs text-[#888888]">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="correo@ejemplo.com"
              className="rounded-none border-[#E8E8E8] bg-[#FFFFFF] text-sm text-[#000000]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[#888888]">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="••••••••"
              className="rounded-none border-[#E8E8E8] bg-[#FFFFFF] text-sm text-[#000000]"
            />
          </div>
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs text-[#888888]">
                Confirmar contraseña
              </label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="rounded-none border-[#E8E8E8] bg-[#FFFFFF] text-sm text-[#000000]"
              />
            </div>
          )}
        </div>

        <Button
          type="button"
          className="mt-6 h-12 w-full rounded-none bg-[#000000] text-sm font-medium text-[#FFFFFF] hover:bg-[#333333] disabled:opacity-50"
          disabled={loading}
          onClick={() => void (mode === "signin" ? handleSignIn() : handleSignUp())}
        >
          {loading
            ? "Espera…"
            : mode === "signin"
              ? "Entrar"
              : "Crear cuenta"}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
