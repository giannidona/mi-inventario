-- Run this in Supabase → SQL Editor (or supabase db push) once.
-- Also enable: Authentication → Providers → Anonymous sign-in.

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text not null default '—',
  category text not null,
  status text not null,
  notes text,
  image_path text not null,
  created_at timestamptz not null default now(),
  constraint inventory_items_category_check check (
    category in ('Perfumes', 'Ropa', 'Zapatillas', 'Accesorios')
  ),
  constraint inventory_items_status_check check (
    status in ('En uso', 'Guardado', 'Wishlist')
  )
);

create index if not exists inventory_items_user_created_idx
  on public.inventory_items (user_id, created_at desc);

alter table public.inventory_items enable row level security;

drop policy if exists "inventory_items_select_own" on public.inventory_items;
drop policy if exists "inventory_items_insert_own" on public.inventory_items;
drop policy if exists "inventory_items_update_own" on public.inventory_items;
drop policy if exists "inventory_items_delete_own" on public.inventory_items;

create policy "inventory_items_select_own"
  on public.inventory_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "inventory_items_insert_own"
  on public.inventory_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "inventory_items_update_own"
  on public.inventory_items for update
  to authenticated
  using (auth.uid() = user_id);

create policy "inventory_items_delete_own"
  on public.inventory_items for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('inventory-images', 'inventory-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "inventory_images_select_public" on storage.objects;
drop policy if exists "inventory_images_insert_own_folder" on storage.objects;
drop policy if exists "inventory_images_update_own_folder" on storage.objects;
drop policy if exists "inventory_images_delete_own_folder" on storage.objects;

create policy "inventory_images_select_public"
  on storage.objects for select
  using (bucket_id = 'inventory-images');

create policy "inventory_images_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'inventory-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "inventory_images_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'inventory-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "inventory_images_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'inventory-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );
