"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/utils/supabase/client"
import { InventoryAuthSheet } from "@/components/inventory-auth-sheet"
import { normalizeUsername, validateUsernameFormat } from "@/lib/username"

export default function HomePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [slugInput, setSlugInput] = useState("")
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")

  const slugError = slugInput
    ? validateUsernameFormat(normalizeUsername(slugInput))
    : null

  const goToProfile = useCallback(() => {
    const s = normalizeUsername(slugInput)
    const err = validateUsernameFormat(s)
    if (err) {
      toast.error(err)
      return
    }
    router.push(`/${s}`)
  }, [router, slugInput])

  const handleAuthSuccess = useCallback(
    (username: string) => {
      router.refresh()
      router.push(`/${normalizeUsername(username)}`)
    },
    [router]
  )

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFFFFF] px-4 py-16">
      <div className="mx-auto w-full max-w-md text-center">
        <h1 className="text-xs font-semibold tracking-[0.2em] text-[#000000]">Mi inventario</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#444444]">
          Cada persona tiene su inventario público en una dirección propia. Visitá{" "}
          <span className="font-medium text-[#000000]">/tuusuario</span> para ver lo que publicó.
        </p>

        <div className="mt-10 text-left">
          <label className="mb-2 block text-xs font-medium text-[#888888]">Ver un inventario</label>
          <div className="flex gap-2">
            <div className="flex min-w-0 flex-1 items-center border border-[#E8E8E8] bg-[#FFFFFF] px-3">
              <span className="shrink-0 text-sm text-[#888888]">/</span>
              <Input
                value={slugInput}
                onChange={(e) =>
                  setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="giannidona"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                onKeyDown={(e) => e.key === "Enter" && goToProfile()}
              />
            </div>
            <Button
              type="button"
              className="shrink-0 rounded-none bg-[#000000] px-6 text-[#FFFFFF] hover:bg-[#333333]"
              onClick={goToProfile}
            >
              Ir
            </Button>
          </div>
          {slugError ? (
            <p className="mt-2 text-xs text-red-600">{slugError}</p>
          ) : null}
        </div>

        <div className="mt-12 border-t border-[#F0F0F0] pt-10">
          <p className="text-xs text-[#888888]">¿Querés publicar tus ítems?</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              className="rounded-none bg-[#000000] text-[#FFFFFF] hover:bg-[#333333]"
              onClick={() => {
                setAuthMode("signup")
                setAuthOpen(true)
              }}
            >
              Crear cuenta
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-none border-[#E0E0E0]"
              onClick={() => {
                setAuthMode("signin")
                setAuthOpen(true)
              }}
            >
              <LogIn className="size-4" strokeWidth={1.5} />
              Iniciar sesión
            </Button>
          </div>
        </div>
      </div>

      <InventoryAuthSheet
        open={authOpen}
        onOpenChange={setAuthOpen}
        supabase={supabase}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}
