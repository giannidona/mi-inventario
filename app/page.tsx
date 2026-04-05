"use client"

import { useState } from "react"
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

  const filteredProducts = activeCategory === "All" 
    ? mockProducts 
    : mockProducts.filter(p => p.category === activeCategory)

  const statusColors: Record<Status, string> = {
    "En uso": "bg-[#E8E8E8] text-[#000000]",
    "Guardado": "bg-[#F0F0F0] text-[#888888]",
    "Wishlist": "bg-[#F5F5F5] text-[#888888]",
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF] px-4 py-4 flex items-center justify-between">
        <div className="w-8" />
        <h1 className="text-xs font-semibold tracking-[0.2em] text-[#000000]">MI INVENTORY</h1>
        <button className="w-8 h-8 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
        </button>
      </header>

      {/* Category Filters - Only show on home tab */}
      {activeTab === "home" && (
        <div className="px-4 pb-4 overflow-x-auto scrollbar-hide">
          <div className="flex justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
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
      <main className="flex-1 pb-24 overflow-y-auto">
        {/* Home Tab - Product Grid */}
        {activeTab === "home" && (
          <div className="flex justify-center">
            <div className="w-1/2 min-w-[280px] max-w-[400px]">
              <div className="grid grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative cursor-pointer group"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Add Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsAddSheetOpen(true)
                      }}
                      className="absolute top-0 right-0 z-10 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-3 h-3 text-[#888888]" strokeWidth={2} />
                    </button>
                    
                    {/* Product Image */}
                    <div className="aspect-square flex items-center justify-center">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="pt-1 text-center">
                      <p className="text-[9px] text-[#888888] truncate">{product.brand}</p>
                      <p className="text-[10px] font-semibold text-[#000000] truncate">{product.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold text-[#000000] mb-4">Categories</h2>
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
          <div className="px-6 py-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <Input
                placeholder="Search items..."
                className="pl-10 border-[#E8E8E8] rounded-none text-sm bg-[#FFFFFF] text-[#000000] placeholder:text-[#CCCCCC]"
              />
            </div>
            <p className="text-xs text-[#888888] text-center">Search your inventory by name or brand</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="px-6 py-4">
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
              onClick={() => setIsAddSheetOpen(true)}
              className="w-full mt-8 py-3 bg-[#000000] text-[#FFFFFF] text-sm font-medium"
            >
              Add New Item
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#F0F0F0] px-4 py-2 z-50">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setActiveTab("home")}
            className={cn(
              "flex flex-col items-center gap-0.5 p-2",
              activeTab === "home" ? "text-[#000000]" : "text-[#888888]"
            )}
          >
            <Grid3X3 className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[9px]">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab("categories")}
            className={cn(
              "flex flex-col items-center gap-0.5 p-2",
              activeTab === "categories" ? "text-[#000000]" : "text-[#888888]"
            )}
          >
            <LayoutGrid className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[9px]">Categories</span>
          </button>
          <button 
            onClick={() => setActiveTab("search")}
            className={cn(
              "flex flex-col items-center gap-0.5 p-2",
              activeTab === "search" ? "text-[#000000]" : "text-[#888888]"
            )}
          >
            <Search className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[9px]">Search</span>
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex flex-col items-center gap-0.5 p-2",
              activeTab === "profile" ? "text-[#000000]" : "text-[#888888]"
            )}
          >
            <User className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[9px]">Profile</span>
          </button>
        </div>
      </nav>

      {/* Product Detail Popup */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          {/* Blurred Backdrop */}
          <div className="absolute inset-0 bg-[#000000]/30 backdrop-blur-sm" />
          
          {/* Popup Content */}
          <div 
            className="relative bg-[#FFFFFF] w-full max-w-lg flex overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product Image - Left Side */}
            <div className="w-1/2 bg-[#FAFAFA] flex items-center justify-center p-6">
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Product Info - Right Side */}
            <div className="w-1/2 p-6 flex flex-col justify-center">
              <p className="text-xs text-[#888888] mb-1">{selectedProduct.brand}</p>
              <h2 className="text-lg font-semibold text-[#000000] mb-4">{selectedProduct.name}</h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={cn("px-3 py-1 text-xs font-medium", statusColors[selectedProduct.status])}>
                  {selectedProduct.status}
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-[#F5F5F5] text-[#888888]">
                  {selectedProduct.category}
                </span>
              </div>
              
              {selectedProduct.notes && (
                <div>
                  <p className="text-[10px] text-[#888888] mb-1">Notas</p>
                  <p className="text-sm text-[#000000]">{selectedProduct.notes}</p>
                </div>
              )}
              
              {/* Close button */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="mt-6 py-2 text-xs text-[#888888] hover:text-[#000000] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-[20px] bg-[#FFFFFF] border-none">
          <SheetHeader className="px-6 pt-2">
            <div className="w-12 h-1 bg-[#E0E0E0] rounded-full mx-auto mb-4" />
            <SheetTitle className="text-lg font-semibold text-[#000000]">Add Item</SheetTitle>
            <SheetDescription className="sr-only">Add a new item to your inventory</SheetDescription>
          </SheetHeader>
          
          <div className="px-6 pb-8 space-y-5 overflow-y-auto">
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
