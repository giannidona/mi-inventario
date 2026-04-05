-- Ejecutar en Supabase SQL Editor después de la migración inicial.
-- Exploradores (rol anon): solo lectura de ítems.
-- Cuenta con email/contraseña: puede insertar/actualizar/borrar lo suyo (no anónimos).
-- Desactiva "Anonymous sign-in" en Authentication → Providers si ya no lo usas.

-- Tabla inventory_items
drop policy if exists "inventory_items_select_own" on public.inventory_items;
drop policy if exists "inventory_items_insert_own" on public.inventory_items;
drop policy if exists "inventory_items_update_own" on public.inventory_items;
drop policy if exists "inventory_items_delete_own" on public.inventory_items;
drop policy if exists "inventory_items_select_public" on public.inventory_items;
drop policy if exists "inventory_items_insert_registered" on public.inventory_items;
drop policy if exists "inventory_items_update_registered" on public.inventory_items;
drop policy if exists "inventory_items_delete_registered" on public.inventory_items;

create policy "inventory_items_select_public"
  on public.inventory_items for select
  using (true);

create policy "inventory_items_insert_registered"
  on public.inventory_items for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (auth.jwt() -> 'app_metadata' ->> 'is_anonymous') is distinct from 'true'
  );

create policy "inventory_items_update_registered"
  on public.inventory_items for update
  to authenticated
  using (
    auth.uid() = user_id
    and (auth.jwt() -> 'app_metadata' ->> 'is_anonymous') is distinct from 'true'
  );

create policy "inventory_items_delete_registered"
  on public.inventory_items for delete
  to authenticated
  using (
    auth.uid() = user_id
    and (auth.jwt() -> 'app_metadata' ->> 'is_anonymous') is distinct from 'true'
  );

-- Storage: solo usuarios registrados (no anónimos) en su carpeta
drop policy if exists "inventory_images_insert_own_folder" on storage.objects;
drop policy if exists "inventory_images_update_own_folder" on storage.objects;
drop policy if exists "inventory_images_delete_own_folder" on storage.objects;
drop policy if exists "inventory_images_insert_registered" on storage.objects;
drop policy if exists "inventory_images_update_registered" on storage.objects;
drop policy if exists "inventory_images_delete_registered" on storage.objects;

create policy "inventory_images_insert_registered"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'inventory-images'
    and split_part(name, '/', 1) = auth.uid()::text
    and (auth.jwt() -> 'app_metadata' ->> 'is_anonymous') is distinct from 'true'
  );

create policy "inventory_images_update_registered"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'inventory-images'
    and split_part(name, '/', 1) = auth.uid()::text
    and (auth.jwt() -> 'app_metadata' ->> 'is_anonymous') is distinct from 'true'
  );

create policy "inventory_images_delete_registered"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'inventory-images'
    and split_part(name, '/', 1) = auth.uid()::text
    and (auth.jwt() -> 'app_metadata' ->> 'is_anonymous') is distinct from 'true'
  );
