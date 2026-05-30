-- ============================================================
-- FIX CHECKOUT — VERSI IDEMPOTENT (aman di-run berkali-kali)
-- ============================================================
-- Buka: https://supabase.com/dashboard/project/umgkqmfisducjekpzxgi/sql/new
-- Copy SELURUH file ini, paste, klik RUN.
-- Kalau ada error "already member of publication" — sudah di-handle.
-- ============================================================

-- 1. ORDERS — tambah kolom
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists invoice_number text unique;
alter table public.orders add column if not exists total_price numeric default 0;
alter table public.orders add column if not exists shipping_status text default 'menunggu_pembayaran';
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists address text;
create index if not exists orders_user_id_idx on public.orders(user_id);

-- 2. RLS + GRANT orders
alter table public.orders enable row level security;
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own" on public.orders
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  quantity integer not null check (quantity > 0),
  price numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- 4. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text, phone text, address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email) select id, email from auth.users on conflict (id) do nothing;

-- 5. REALTIME (idempotent — abaikan kalau tabel sudah terdaftar)
alter table public.orders replica identity full;
alter table public.order_items replica identity full;
alter table public.profiles replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.order_items;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null; when others then null; end $$;

-- 6. REFRESH SCHEMA CACHE (WAJIB!)
notify pgrst, 'reload schema';

-- ============================================================
-- SELESAI. Refresh website → coba checkout lagi.
-- ============================================================
