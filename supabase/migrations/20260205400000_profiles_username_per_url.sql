-- Perfil por @usuario: URL /tuusuario solo muestra ítems de ese usuario.
-- Ejecutar en Supabase SQL Editor.
-- Requiere haber aplicado migraciones anteriores (inventory_items, políticas de escritura).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

create index if not exists profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Lectura pública de ítems solo vía RPC (no listar toda la tabla con anon).
drop policy if exists "inventory_items_select_public" on public.inventory_items;

drop policy if exists "inventory_items_select_own" on public.inventory_items;
create policy "inventory_items_select_own"
  on public.inventory_items for select
  to authenticated
  using (auth.uid() = user_id);

-- RPC: perfil por nombre de usuario (para saber si existe la página)
create or replace function public.get_profile_by_username(p_username text)
returns table (id uuid, username text, display_name text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username, p.display_name
  from public.profiles p
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_profile_by_username(text) to anon, authenticated;

-- RPC: ítems visibles en /usuario
create or replace function public.get_inventory_by_username(p_username text)
returns setof public.inventory_items
language sql
security definer
set search_path = public
stable
as $$
  select i.*
  from public.inventory_items i
  inner join public.profiles p on p.id = i.user_id
  where lower(p.username) = lower(trim(p_username))
  order by i.created_at desc;
$$;

grant execute on function public.get_inventory_by_username(text) to anon, authenticated;

-- Comprobar @ libre (antes de registro)
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    not exists (
      select 1 from public.profiles pr
      where lower(pr.username) = lower(trim(p_username))
    )
    and lower(trim(p_username)) ~ '^[a-z0-9_]{3,30}$'
    and lower(trim(p_username)) not in (
      'api', 'admin', 'login', 'auth', 'www', 'settings', 'help', 'app',
      '_next', 'ingresar', 'registro', 'perfil', 'buscar'
    );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

-- Crear fila en profiles al registrarse (username obligatorio en raw_user_meta_data)
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  un text;
begin
  un := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));
  if un = '' then
    return new;
  end if;
  if un !~ '^[a-z0-9_]{3,30}$' then
    raise exception 'invalid username format';
  end if;
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    un,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  );
  return new;
exception
  when unique_violation then
    raise exception 'username already taken';
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();
