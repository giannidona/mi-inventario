"use client"

import { useState, useEffect } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
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

type Mode = "signin" | "signup"

interface InventoryAuthSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supabase: SupabaseClient
  initialMode?: Mode
}

export function InventoryAuthSheet({
  open,
  onOpenChange,
  supabase,
  initialMode = "signin",
}: InventoryAuthSheetProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setMode(initialMode)
  }, [open, initialMode])

  const resetFields = () => {
    setName("")
    setEmail("")
    setPassword("")
    setConfirm("")
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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      toast.success("Sesión iniciada.")
      resetFields()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo iniciar sesión.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
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
      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: origin ? `${origin}/` : undefined,
        },
      })
      if (error) throw error
      if (data.session) {
        toast.success("Cuenta creada. Ya puedes publicar ítems.")
        resetFields()
        onOpenChange(false)
      } else {
        toast.success(
          "Revisa tu correo para confirmar la cuenta (si la confirmación está activada en Supabase)."
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
            Necesitas cuenta para subir ítems. Ver el inventario no requiere registro.
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
