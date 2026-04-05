export type InventoryCategory = "Perfumes" | "Ropa" | "Zapatillas" | "Accesorios"
export type InventoryStatus = "En uso" | "Guardado" | "Wishlist"

export interface InventoryProduct {
  id: string
  name: string
  brand: string
  category: InventoryCategory
  image: string
  notes?: string
  status: InventoryStatus
}
