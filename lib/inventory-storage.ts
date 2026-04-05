export const INVENTORY_STORAGE_KEY = "mi-inventory:products:v1"

const CATEGORIES = new Set<string>(["Perfumes", "Ropa", "Zapatillas", "Accesorios"])
const STATUSES = new Set<string>(["En uso", "Guardado", "Wishlist"])

export interface InventoryProduct {
  id: number
  name: string
  brand: string
  category: "Perfumes" | "Ropa" | "Zapatillas" | "Accesorios"
  image: string
  notes?: string
  status: "En uso" | "Guardado" | "Wishlist"
}

function isInventoryProduct(x: unknown): x is InventoryProduct {
  if (x === null || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  if (typeof o.id !== "number" || !Number.isFinite(o.id)) return false
  if (typeof o.name !== "string" || !o.name.trim()) return false
  if (typeof o.brand !== "string") return false
  if (typeof o.category !== "string" || !CATEGORIES.has(o.category)) return false
  if (typeof o.image !== "string" || o.image.length < 4) return false
  const imageOk =
    o.image.startsWith("data:") ||
    o.image.startsWith("/") ||
    o.image.startsWith("blob:")
  if (!imageOk) return false
  if (typeof o.status !== "string" || !STATUSES.has(o.status)) return false
  if (o.notes !== undefined && typeof o.notes !== "string") return false
  return true
}

export function loadInventoryProducts(): InventoryProduct[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isInventoryProduct)
  } catch {
    return []
  }
}

export function saveInventoryProducts(products: InventoryProduct[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(products))
  } catch (e) {
    console.error("[inventory] Could not save to localStorage", e)
  }
}
