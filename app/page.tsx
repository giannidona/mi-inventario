"use client"

import { useState, useEffect } from "react"
import { Grid3X3, LayoutGrid, Search, User, Plus, ShoppingBag, Upload } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Category = "All" | "Perfumes" | "Ropa" | "Zapatillas" | "Accesorios"
type Status = "En uso" | "Guardado" | "Wishlist"

interface Product {
  id: number
  name: string
  brand: string
  category: Exclude<Category, "All">
  image: string
  notes?: string
  status: Status
}

const mockProducts: Product[] = [
  // Perfumes
  { id: 1, name: "Sauvage", brand: "Dior", category: "Perfumes", image: "/images/perfume-bottle.jpg", status: "En uso", notes: "Favorito para el día" },
  { id: 2, name: "Y Eau de Parfum", brand: "YSL", category: "Perfumes", image: "/images/perfume-bottle.jpg", status: "Guardado", notes: "Para ocasiones especiales" },
  { id: 3, name: "Bleu de Chanel", brand: "Chanel", category: "Perfumes", image: "/images/perfume-bottle.jpg", status: "En uso", notes: "Clásico versátil" },
  // Zapatillas
  { id: 4, name: "Air Force 1", brand: "Nike", category: "Zapatillas", image: "/images/sneaker.jpg", status: "En uso" },
  { id: 5, name: "Samba OG", brand: "Adidas", category: "Zapatillas", image: "/images/sneaker.jpg", status: "Guardado" },
  { id: 6, name: "550", brand: "New Balance", category: "Zapatillas", image: "/images/sneaker.jpg", status: "Wishlist" },
  { id: 7, name: "Dunk Low", brand: "Nike", category: "Zapatillas", image: "/images/sneaker.jpg", status: "En uso" },
  // Ropa
  { id: 8, name: "Essential Tee", brand: "Fear of God", category: "Ropa", image: "/images/tshirt.jpg", status: "En uso" },
  { id: 9, name: "Oxford Shirt", brand: "Uniqlo", category: "Ropa", image: "/images/tshirt.jpg", status: "Guardado" },
  { id: 10, name: "Oversized Hoodie", brand: "Stüssy", category: "Ropa", image: "/images/hoodie.jpg", status: "En uso" },
  // Accesorios
  { id: 11, name: "City Bag", brand: "Arket", category: "Accesorios", image: "/images/bag.jpg", status: "En uso" },
  { id: 12, name: "Logo Cap", brand: "Carhartt WIP", category: "Accesorios", image: "/images/cap.jpg", status: "Guardado" },
]

const categories: Category[] = ["All", "Perfumes", "Ropa", "Zapatillas", "Accesorios"]

const NAV_ITEMS = [
  { id: "home" as const, Icon: Grid3X3, label: "Home" },
  { id: "categories" as const, Icon: LayoutGrid, label: "Categories" },
  { id: "search" as const, Icon: Search, label: "Search" },
  { id: "profile" as const, Icon: User, label: "Profile" },
]

export default function MiInventory() {
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "categories" | "search" | "profile">("home")
  
  // Add item form state
  const [newItem, setNewItem] = useState({
    name: "",
    brand: "",
    category: "Ropa" as Exclude<Category, "All">,
    notes: "",
    status: "Guardado" as Status,
  })

  const [addSheetWide, setAddSheetWide] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setAddSheetWide(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const filteredProducts = activeCategory === "All" 
    ? mockProducts 
    : mockProducts.filter(p => p.category === activeCategory)

  const statusColors: Record<Status, string> = {
    "En uso": "bg-[#E8E8E8] text-[#000000]",
    "Guardado": "bg-[#F0F0F0] text-[#888888]",
    "Wishlist": "bg-[#F5F5F5] text-[#888888]",
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFFFFF] md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-52 md:shrink-0 md:flex-col md:border-r md:border-[#F0F0F0] md:bg-[#FFFFFF] md:py-6 md:px-3">
        <p className="px-3 pb-6 text-xs font-semibold tracking-[0.2em] text-[#000000]">
          MI INVENTORY
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
            MI INVENTORY
          </h1>
          <div className="hidden md:block md:flex-1" aria-hidden />
          <button
            type="button"
            className="ml-auto flex size-8 shrink-0 items-center justify-center md:ml-0"
            aria-label="Bag"
          >
            <ShoppingBag className="size-5 text-[#000000]" strokeWidth={1.5} />
          </button>
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
              <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsAddSheetOpen(true)
                      }}
                      className="absolute top-0 right-0 z-10 flex size-6 items-center justify-center opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 max-md:pointer-events-auto max-md:opacity-100 md:size-5"
                      aria-label="Add item"
                    >
                      <Plus className="size-3 text-[#888888]" strokeWidth={2} />
                    </button>

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
            </div>
          )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 md:px-8 lg:px-10">
            <h2 className="mb-4 text-sm font-semibold text-[#000000] md:text-base">Categories</h2>
            <div className="space-y-3">
              {(["Perfumes", "Ropa", "Zapatillas", "Accesorios"] as const).map((cat) => {
                const count = mockProducts.filter(p => p.category === cat).length
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
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-[#F0F0F0] rounded-full flex items-center justify-center mb-3">
                <User className="w-8 h-8 text-[#888888]" strokeWidth={1.5} />
              </div>
              <h2 className="text-sm font-semibold text-[#000000]">My Profile</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-[#F0F0F0]">
                <span className="text-sm text-[#000000]">Total Items</span>
                <span className="text-sm font-medium text-[#000000]">{mockProducts.length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#F0F0F0]">
                <span className="text-sm text-[#000000]">En uso</span>
                <span className="text-sm font-medium text-[#000000]">{mockProducts.filter(p => p.status === "En uso").length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#F0F0F0]">
                <span className="text-sm text-[#000000]">Guardado</span>
                <span className="text-sm font-medium text-[#000000]">{mockProducts.filter(p => p.status === "Guardado").length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#F0F0F0]">
                <span className="text-sm text-[#000000]">Wishlist</span>
                <span className="text-sm font-medium text-[#000000]">{mockProducts.filter(p => p.status === "Wishlist").length}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsAddSheetOpen(true)}
              className="mt-8 w-full bg-[#000000] py-3 text-sm font-medium text-[#FFFFFF] md:max-w-xs"
            >
              Add New Item
            </button>
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
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
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
            <SheetDescription className="sr-only">Add a new item to your inventory</SheetDescription>
          </SheetHeader>

          <div className="max-h-[calc(90vh-8rem)] space-y-5 overflow-y-auto px-6 pb-8 md:max-h-[calc(100vh-6rem)]">
            {/* Photo Upload */}
            <div className="aspect-square bg-[#F8F8F8] flex flex-col items-center justify-center cursor-pointer">
              <Upload className="w-8 h-8 text-[#CCCCCC] mb-2" strokeWidth={1.5} />
              <span className="text-xs text-[#888888]">Upload photo</span>
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
              className="w-full bg-[#000000] text-[#FFFFFF] rounded-none h-12 text-sm font-medium hover:bg-[#333333]"
              onClick={() => setIsAddSheetOpen(false)}
            >
              Add to Inventory
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
