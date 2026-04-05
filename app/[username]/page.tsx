import { InventoryApp } from "@/components/inventory-app"
import { normalizeUsername } from "@/lib/username"

type Props = {
  params: Promise<{ username: string }>
}

export default async function UserInventoryPage({ params }: Props) {
  const { username } = await params
  const slug = normalizeUsername(username)
  return <InventoryApp profileUsername={slug} />
}
