"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { toast } from "sonner"
import {
  Grid3X3,
  LayoutGrid,
  Search,
  User,
  Plus,
  ShoppingBag,
  ImageIcon,
  LogIn,
} from "lucide-react"
import type { Session } from "@supabase/supabase-js"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  processUploadedProductPhoto,
  validateImageFile,
} from "@/lib/process-product-photo"
import type { InventoryProduct } from "@/lib/inventory-types"
import {
  createInventoryItem,
  fetchInventoryItems,
} from "@/lib/inventory-supabase"
import { createClient } from "@/utils/supabase/client"
import { canManageInventory, displayUserName } from "@/lib/auth-utils"
import { InventoryAuthSheet } from "@/components/inventory-auth-sheet"

type Category = "All" | "Perfumes" | "Ropa" | "Zapatillas" | "Accesorios"
type Status = "En uso" | "Guardado" | "Wishlist"

type Product = InventoryProduct

const categories: Category[] = ["All", "Perfumes", "Ropa", "Zapatillas", "Accesorios"]

const NAV_ITEMS = [
  { id: "home" as const, Icon: Grid3X3, label: "Home" },
  { id: "categories" as const, Icon: LayoutGrid, label: "Categories" },
  { id: "search" as const, Icon: Search, label: "Search" },
  { id: "profile" as const, Icon: User, label: "Profile" },
]

const EMPTY_NEW_ITEM = {
  name: "",
  brand: "",
  category: "Ropa" as Exclude<Category, "All">,
  notes: "",
  status: "Guardado" as Status,
}

export default function MiInventory() {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const [authSheetMode, setAuthSheetMode] = useState<"signin" | "signup">("signin")
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "categories" | "search" | "profile">("home")

  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const [processStatus, setProcessStatus] = useState("")
  const [processPercent, setProcessPercent] = useState(0)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [isSavingItem, setIsSavingItem] = useState(false)

  const [addSheetWide, setAddSheetWide] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadPublicInventory() {
      setInventoryLoading(true)
      try {
        const items = await fetchInventoryItems(supabase)
        if (!cancelled) setProducts(items)
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          toast.error(
            "No se pudo cargar el inventario. Revisa la conexión y las políticas RLS en Supabase."
          )
        }
      } finally {
        if (!cancelled) setInventoryLoading(false)
      }
    }
    void loadPublicInventory()
    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    async function syncSession() {
      const {
        data: { session: s },
      } = await supabase.auth.getSession()
      if (s?.user?.is_anonymous) {
        await supabase.auth.signOut()
        setSession(null)
        return
      }
      setSession(s)
    }
    void syncSession()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (s?.user?.is_anonymous) {
        await supabase.auth.signOut()
        setSession(null)
        return
      }
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const contributor = canManageInventory(session?.user)

  const openAddItemSheet = useCallback(() => {
    if (!contributor) {
      setAuthSheetMode("signup")
      setAuthSheetOpen(true)
      return
    }
    setIsAddSheetOpen(true)
  }, [contributor])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setAddSheetWide(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const clearPhotoPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setProcessedBlob(null)
    setPhotoError(null)
    setProcessStatus("")
    setProcessPercent(0)
  }, [])

  const resetAddForm = useCallback(() => {
    setNewItem(EMPTY_NEW_ITEM)
    clearPhotoPreview()
  }, [clearPhotoPreview])

  const handleAddSheetOpenChange = useCallback(
    (open: boolean) => {
      setIsAddSheetOpen(open)
      if (!open) resetAddForm()
    },
    [resetAddForm]
  )

  useEffect(() => {
    if (!contributor && isAddSheetOpen) {
      setIsAddSheetOpen(false)
      resetAddForm()
    }
  }, [contributor, isAddSheetOpen, resetAddForm])

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory)

  const handlePhotoInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setPhotoError(validationError)
      toast.error(validationError)
      return
    }

    setPhotoError(null)
    setIsProcessingPhoto(true)
    setProcessStatus("Starting…")
    setProcessPercent(0)

    try {
      const blob = await processUploadedProductPhoto(file, (_stage, message, percent) => {
        setProcessStatus(message)
        setProcessPercent(percent)
      })
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(blob)
      })
      setProcessedBlob(blob)
      toast.success("Background removed and photo enhanced. Fill in the details below.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not process the image. Try another photo."
      setPhotoError(message)
      toast.error(message)
    } finally {
      setIsProcessingPhoto(false)
      setProcessStatus("")
      setProcessPercent(0)
    }
  }

  const handleAddProduct = async () => {
    const uid = session?.user?.id
    if (!contributor || !uid) {
      toast.error("Inicia sesión o crea una cuenta para guardar ítems.")
      return
    }
    if (!processedBlob || !previewUrl) {
      toast.error("Upload a photo first — we will remove the background and enhance it.")
      return
    }
    if (!newItem.name.trim()) {
      toast.error("Add a name for this item.")
      return
    }

    setIsSavingItem(true)
    try {
      const product = await createInventoryItem(supabase, uid, processedBlob, {
        name: newItem.name.trim(),
        brand: newItem.brand.trim() || "—",
        category: newItem.category,
        status: newItem.status,
        notes: newItem.notes.trim() || undefined,
      })
      setProducts((prev) => [product, ...prev])
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setProcessedBlob(null)
      setNewItem(EMPTY_NEW_ITEM)
      setIsAddSheetOpen(false)
      toast.success("Ítem guardado.")
    } catch (e) {
      console.error(e)
      toast.error(
        e instanceof Error ? e.message : "Could not save the item. Check Supabase table and storage policies."
      )
    } finally {
      setIsSavingItem(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFFFFF] md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-52 md:shrink-0 md:flex-col md:border-r md:border-[#F0F0F0] md:bg-[#FFFFFF] md:py-6 md:px-3">
        <p className="px-3 pb-6 text-xs font-semibold tracking-[0.2em] text-[#000000]">
          Mi inventario
        </p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                activeTab === id
                  ? "bg-[#000000] text-[#FFFFFF]"
                  : "text-[#888888] hover:bg-[#F5F5F5] hover:text-[#000000]"
              )}
            >
              <Icon className="size-5 shrink-0" strokeWidth={1.5} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-transparent bg-[#FFFFFF] px-4 py-4 md:border-[#F0F0F0] md:px-8 lg:px-10">
          <div className="w-8 md:hidden" aria-hidden />
          <h1 className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold tracking-[0.2em] text-[#000000] md:hidden">
            Mi inventario
          </h1>
          <div className="hidden md:flex-1 md:block" aria-hidden />
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {!contributor && (
              <button
                type="button"
                onClick={() => {
                  setAuthSheetMode("signin")
                  setAuthSheetOpen(true)
                }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#000000] hover:bg-[#F5F5F5]"
              >
                <LogIn className="size-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center"
              aria-label="Bag"
            >
              <ShoppingBag className="size-5 text-[#000000]" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Category Filters - Only show on home tab */}
        {activeTab === "home" && (
          <div
            className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-4 [-webkit-overflow-scrolling:touch] scrollbar-hide [touch-action:pan-x] md:overflow-visible md:px-8 lg:px-10"
            role="tablist"
            aria-label="Filter by category"
          >
            <div className="flex w-max max-w-none snap-x snap-mandatory gap-2 px-4 md:w-full md:max-w-full md:flex-wrap md:justify-start md:gap-2 md:px-0 md:snap-none">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "shrink-0 snap-start px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:px-4",
                    activeCategory === category
                      ? "bg-[#000000] text-[#FFFFFF]"
                      : "bg-[#F5F5F5] text-[#888888]"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          {/* Home Tab - Product Grid */}
          {activeTab === "home" && (
            <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-10">
              {inventoryLoading ? (
                <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3">
                  <Spinner className="size-8 text-[#000000]" />
                  <p className="text-xs text-[#888888]">Loading your inventory…</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2 px-4 text-center">
                  <p className="text-sm font-medium text-[#000000]">No items yet</p>
                  <p className="max-w-sm text-xs text-[#888888]">
                    {contributor
                      ? "Añade una foto para crear tu primer ítem."
                      : "Explora sin cuenta. Para publicar, regístrate con nombre y contraseña."}
                  </p>
                  <Button
                    type="button"
                    className="mt-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#333333]"
                    onClick={openAddItemSheet}
                  >
                    {contributor ? "Añadir ítem" : "Registrarse para publicar"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group relative cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {contributor && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsAddSheetOpen(true)
                          }}
                          className="absolute top-0 right-0 z-10 flex size-6 items-center justify-center opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 max-md:pointer-events-auto max-md:opacity-100 md:size-5"
                          aria-label="Añadir ítem"
                        >
                          <Plus className="size-3 text-[#888888]" strokeWidth={2} />
                        </button>
                      )}

                      <div className="flex aspect-square items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="size-full object-contain"
                        />
                      </div>

                      <div className="pt-1 text-center">
                        <p className="truncate text-[9px] text-[#888888] md:text-[10px]">
                          {product.brand}
                        </p>
                        <p className="truncate text-[10px] font-semibold text-[#000000] md:text-xs">
                          {product.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 md:px-8 lg:px-10">
            <h2 className="mb-4 text-sm font-semibold text-[#000000] md:text-base">Categories</h2>
            <div className="space-y-3">
              {(["Perfumes", "Ropa", "Zapatillas", "Accesorios"] as const).map((cat) => {
                const count = products.filter((p) => p.category === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat)
                      setActiveTab("home")
                    }}
                    className="w-full flex items-center justify-between p-4 bg-[#F8F8F8] text-left"
                  >
                    <span className="text-sm font-medium text-[#000000]">{cat}</span>
                    <span className="text-xs text-[#888888]">{count} items</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 md:px-8 lg:px-10">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <Input
                placeholder="Search items..."
                className="w-full pl-10 border-[#E8E8E8] rounded-none text-sm bg-[#FFFFFF] text-[#000000] placeholder:text-[#CCCCCC]"
              />
            </div>
            <p className="text-xs text-[#888888] text-center">Search your inventory by name or brand</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 md:px-8 lg:px-10">
            <div className="mb-8 flex flex-col items-center">
              <div className="mb-3 flex size-20 items-center justify-center rounded-full bg-[#F0F0F0]">
                <User className="size-8 text-[#888888]" strokeWidth={1.5} />
              </div>
              <h2 className="text-sm font-semibold text-[#000000]">Perfil</h2>
              {contributor ? (
                <p className="mt-1 max-w-xs text-center text-xs text-[#888888]">
                  {displayUserName(session?.user)}
                  {session?.user?.email ? (
                    <span className="mt-0.5 block text-[#AAAAAA]">{session.user.email}</span>
                  ) : null}
                </p>
              ) : (
                <p className="mt-2 max-w-xs text-center text-xs text-[#888888]">
                  Estás viendo el inventario público. Crea una cuenta para publicar tus propios ítems.
                </p>
              )}
            </div>

            {!contributor && (
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  className="rounded-none bg-[#000000] text-sm text-[#FFFFFF] hover:bg-[#333333]"
                  onClick={() => {
                    setAuthSheetMode("signup")
                    setAuthSheetOpen(true)
                  }}
                >
                  Crear cuenta
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none border-[#E0E0E0] text-sm"
                  onClick={() => {
                    setAuthSheetMode("signin")
                    setAuthSheetOpen(true)
                  }}
                >
                  Iniciar sesión
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-[#F0F0F0]">
                <span className="text-sm text-[#000000]">Ítems en la app</span>
                <span className="text-sm font-medium text-[#000000]">{products.length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#F0F0F0]">
                <span className="text-sm text-[#000000]">En uso</span>
                <span className="text-sm font-medium text-[#000000]">
                  {products.filter((p) => p.status === "En uso").length}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#F0F0F0]">
                <span className="text-sm text-[#000000]">Guardado</span>
                <span className="text-sm font-medium text-[#000000]">
                  {products.filter((p) => p.status === "Guardado").length}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#F0F0F0]">
                <span className="text-sm text-[#000000]">Wishlist</span>
                <span className="text-sm font-medium text-[#000000]">
                  {products.filter((p) => p.status === "Wishlist").length}
                </span>
              </div>
            </div>

            {contributor ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddSheetOpen(true)}
                  className="mt-8 w-full bg-[#000000] py-3 text-sm font-medium text-[#FFFFFF] md:max-w-xs"
                >
                  Añadir ítem
                </button>
                <button
                  type="button"
                  onClick={() => void supabase.auth.signOut()}
                  className="mt-3 w-full border border-[#E8E8E8] py-3 text-sm font-medium text-[#000000] md:max-w-xs"
                >
                  Cerrar sesión
                </button>
              </>
            ) : null}
          </div>
        )}
        </main>

        {/* Bottom Navigation — mobile only */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#F0F0F0] bg-[#FFFFFF] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:hidden">
          <div className="flex items-center justify-around">
            {NAV_ITEMS.map(({ id, Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-2 min-h-[48px] min-w-[48px] justify-center",
                  activeTab === id ? "text-[#000000]" : "text-[#888888]"
                )}
              >
                <Icon className="size-5" strokeWidth={1.5} />
                <span className="text-[9px]">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Product Detail Popup */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-detail-title"
          className="fixed inset-0 z-60 flex cursor-pointer items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6 md:p-8"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="absolute inset-0 bg-[#000000]/40 backdrop-blur-md" />

          <div
            className="relative z-10 my-auto flex w-full max-w-2xl cursor-default flex-col items-center gap-6 sm:gap-8 md:max-w-4xl md:flex-row md:items-center md:gap-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full shrink-0 items-center justify-center md:w-1/2">
              <img
                src={selectedProduct.image}
                alt=""
                className="h-auto max-h-[45vh] w-full max-w-[220px] object-contain drop-shadow-2xl sm:max-h-[50vh] sm:max-w-[280px] md:max-h-none md:max-w-[min(100%,320px)]"
              />
            </div>

            <div className="flex w-full flex-col justify-center text-center md:w-1/2 md:text-left">
              <p className="mb-2 text-sm text-[#FFFFFF]/70">{selectedProduct.brand}</p>
              <h2
                id="product-detail-title"
                className="mb-4 text-2xl font-semibold text-[#FFFFFF] sm:mb-6 sm:text-3xl"
              >
                {selectedProduct.name}
              </h2>

              <div className="mb-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <span className="bg-[#FFFFFF]/20 px-4 py-2 text-sm font-medium text-[#FFFFFF] backdrop-blur-sm">
                  {selectedProduct.status}
                </span>
                <span className="bg-[#FFFFFF]/10 px-4 py-2 text-sm font-medium text-[#FFFFFF]/80 backdrop-blur-sm">
                  {selectedProduct.category}
                </span>
              </div>

              {selectedProduct.notes && (
                <div>
                  <p className="mb-2 text-xs text-[#FFFFFF]/50">Notas</p>
                  <p className="text-base text-[#FFFFFF]/90">{selectedProduct.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item Sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={handleAddSheetOpenChange}>
        <SheetContent
          side={addSheetWide ? "right" : "bottom"}
          className={cn(
            "border-none bg-[#FFFFFF]",
            addSheetWide
              ? "h-full w-full max-w-md border-[#F0F0F0]! border-l! p-0 sm:max-w-lg"
              : "h-[90vh] rounded-t-[20px]"
          )}
        >
          <SheetHeader className={cn("px-6 pt-2", addSheetWide && "pt-6")}>
            {!addSheetWide && (
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#E0E0E0]" />
            )}
            <SheetTitle className="text-lg font-semibold text-[#000000]">Add Item</SheetTitle>
            <SheetDescription>
              Upload a photo — AI removes the background and enhances the image on your device. Then
              add details and save.
            </SheetDescription>
          </SheetHeader>

          <div className="max-h-[calc(90vh-8rem)] space-y-5 overflow-y-auto px-6 pb-8 md:max-h-[calc(100vh-6rem)]">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              onChange={handlePhotoInputChange}
            />

            {/* Photo upload / preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#000000]">Photo</p>
              <button
                type="button"
                disabled={isProcessingPhoto}
                onClick={() => photoInputRef.current?.click()}
                className={cn(
                  "relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden border border-dashed border-[#E0E0E0] bg-[#FAFAFA] transition-colors",
                  !isProcessingPhoto && "cursor-pointer hover:border-[#BBBBBB] hover:bg-[#F5F5F5]",
                  isProcessingPhoto && "cursor-wait opacity-90"
                )}
                style={{
                  backgroundImage: previewUrl
                    ? "linear-gradient(45deg, #E8E8E8 25%, transparent 25%), linear-gradient(-45deg, #E8E8E8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #E8E8E8 75%), linear-gradient(-45deg, transparent 75%, #E8E8E8 75%)"
                    : undefined,
                  backgroundSize: previewUrl ? "12px 12px" : undefined,
                  backgroundPosition: previewUrl ? "0 0, 0 6px, 6px -6px, -6px 0" : undefined,
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Processed preview"
                    className="relative z-10 max-h-[85%] max-w-[85%] object-contain drop-shadow-md"
                  />
                ) : null}
                {!previewUrl && !isProcessingPhoto && (
                  <div className="flex flex-col items-center gap-2 px-4 text-center">
                    <ImageIcon className="size-8 text-[#CCCCCC]" strokeWidth={1.5} />
                    <span className="text-xs text-[#888888]">Tap to upload</span>
                    <span className="text-[10px] leading-snug text-[#AAAAAA]">
                      Background removal + enhance (runs in your browser)
                    </span>
                  </div>
                )}
                {isProcessingPhoto && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#FAFAFA]/90 px-4">
                    <Spinner className="size-8 text-[#000000]" />
                    <p className="text-center text-xs font-medium text-[#000000]">{processStatus}</p>
                    <div className="h-1 w-full max-w-[200px] overflow-hidden bg-[#E8E8E8]">
                      <div
                        className="h-full bg-[#000000] transition-[width] duration-300"
                        style={{ width: `${processPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
              {previewUrl && !isProcessingPhoto && (
                <button
                  type="button"
                  onClick={clearPhotoPreview}
                  className="text-xs font-medium text-[#000000] underline underline-offset-2"
                >
                  Remove photo
                </button>
              )}
              {photoError && <p className="text-xs text-red-600">{photoError}</p>}
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#888888] mb-1.5 block">Name</label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Item name"
                  className="border-[#E8E8E8] rounded-none text-sm bg-[#FFFFFF] text-[#000000] placeholder:text-[#CCCCCC]"
                />
              </div>
              
              <div>
                <label className="text-xs text-[#888888] mb-1.5 block">Brand</label>
                <Input
                  value={newItem.brand}
                  onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                  placeholder="Brand name"
                  className="border-[#E8E8E8] rounded-none text-sm bg-[#FFFFFF] text-[#000000] placeholder:text-[#CCCCCC]"
                />
              </div>
              
              <div>
                <label className="text-xs text-[#888888] mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {(["Perfumes", "Ropa", "Zapatillas", "Accesorios"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewItem({ ...newItem, category: cat })}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium transition-colors",
                        newItem.category === cat
                          ? "bg-[#000000] text-[#FFFFFF]"
                          : "bg-[#F5F5F5] text-[#888888]"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-[#888888] mb-1.5 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(["En uso", "Guardado", "Wishlist"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setNewItem({ ...newItem, status })}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium transition-colors",
                        newItem.status === status
                          ? "bg-[#000000] text-[#FFFFFF]"
                          : "bg-[#F5F5F5] text-[#888888]"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-[#888888] mb-1.5 block">Notes</label>
                <Input
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="border-[#E8E8E8] rounded-none text-sm bg-[#FFFFFF] text-[#000000] placeholder:text-[#CCCCCC]"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <Button
              type="button"
              className="h-12 w-full rounded-none bg-[#000000] text-sm font-medium text-[#FFFFFF] hover:bg-[#333333] disabled:opacity-50"
              disabled={
                !processedBlob ||
                !newItem.name.trim() ||
                isProcessingPhoto ||
                isSavingItem
              }
              onClick={() => void handleAddProduct()}
            >
              {isSavingItem ? "Guardando…" : "Añadir al inventario"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <InventoryAuthSheet
        open={authSheetOpen}
        onOpenChange={setAuthSheetOpen}
        supabase={supabase}
        initialMode={authSheetMode}
      />
    </div>
  )
}
