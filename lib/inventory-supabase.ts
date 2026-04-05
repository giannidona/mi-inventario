import type { SupabaseClient } from "@supabase/supabase-js"
import type { InventoryCategory, InventoryProduct, InventoryStatus } from "@/lib/inventory-types"

const BUCKET = "inventory-images"

export interface InventoryItemRow {
  id: string
  user_id: string
  name: string
  brand: string
  category: string
  status: string
  notes: string | null
  image_path: string
  created_at: string
}

function getImagePublicUrl(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function rowToProduct(
  supabase: SupabaseClient,
  row: InventoryItemRow
): InventoryProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as InventoryCategory,
    status: row.status as InventoryStatus,
    notes: row.notes ?? undefined,
    image: getImagePublicUrl(supabase, row.image_path),
  }
}

export async function fetchInventoryItems(
  supabase: SupabaseClient
): Promise<InventoryProduct[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as InventoryItemRow[]
  return rows.map((row) => rowToProduct(supabase, row))
}

export async function createInventoryItem(
  supabase: SupabaseClient,
  userId: string,
  imageBlob: Blob,
  fields: {
    name: string
    brand: string
    category: InventoryCategory
    status: InventoryStatus
    notes?: string
  }
): Promise<InventoryProduct> {
  const itemId = crypto.randomUUID()
  const path = `${userId}/${itemId}.png`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBlob, {
      contentType: "image/png",
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data: row, error: insertError } = await supabase
    .from("inventory_items")
    .insert({
      id: itemId,
      user_id: userId,
      name: fields.name,
      brand: fields.brand || "—",
      category: fields.category,
      status: fields.status,
      notes: fields.notes?.trim() ? fields.notes.trim() : null,
      image_path: path,
    })
    .select()
    .single()

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path])
    throw insertError
  }

  return rowToProduct(supabase, row as InventoryItemRow)
}
