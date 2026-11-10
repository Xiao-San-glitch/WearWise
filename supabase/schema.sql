-- ===========================================================================
-- WearWise AI — Supabase / PostgreSQL schema
-- ===========================================================================
-- This file is a REFERENCE schema for moving the app off the local JSON store
-- (data/store.json) and onto hosted Postgres + Supabase Auth.
--
-- The running application does NOT read this file and ships with no Supabase
-- client. To use it:
--   1. Create a Supabase project and run this file in the SQL editor.
--   2. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
--      SUPABASE_SERVICE_ROLE_KEY in .env.local.
--   3. Replace the data-access functions in src/lib/db.ts with Supabase
--      queries. The TypeScript shapes in src/lib/types.ts map 1:1 to the
--      tables below.
--
-- Design notes
--   * Product ids stay text ("p001"…) so the existing seed data, saved
--     outfits and affiliate click logs keep working without remapping.
--   * Money is stored as numeric(10,2) in rupees.
--   * Row Level Security is enabled on every table. The catalogue is public
--     read-only; users own their outfits, history and profile; only admins
--     can write products, taxonomy, affiliates or read customer submissions.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'ai_kind') then
    create type public.ai_kind as enum ('stylist', 'chat', 'search');
  end if;
  if not exists (select 1 from pg_type where typname = 'ai_source') then
    create type public.ai_source as enum ('gemini', 'fallback');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  role        public.user_role not null default 'user',
  preferences jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- New sign-ups get a profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used by every admin-only policy below.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Catalogue taxonomy
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  slug   text primary key,
  name   text not null,
  image  text not null default '',
  blurb  text not null default ''
);

create table if not exists public.brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id            text primary key,
  slug          text not null unique,
  name          text not null,
  brand         text not null,
  price         numeric(10,2) not null check (price >= 0),
  mrp           numeric(10,2) not null check (mrp >= 0),
  category      text not null references public.categories (slug) on update cascade,
  audience      text not null check (audience in ('men', 'women', 'unisex')),
  colors        text[] not null default '{}',
  styles        text[] not null default '{}',
  occasions     text[] not null default '{}',
  seasons       text[] not null default '{}',
  fit           text not null check (fit in ('slim', 'regular', 'oversized')),
  sizes         text[] not null default '{}',
  image         text not null default '',
  gallery       text[] not null default '{}',
  description   text not null default '',
  specs         jsonb not null default '[]'::jsonb,  -- [{ "label": "...", "value": "..." }]
  retailer      text not null default '',
  affiliate_url text not null default '',
  sponsored     boolean not null default false,
  rating        numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews       integer not null default 0 check (reviews >= 0),
  stock         integer not null default 0 check (stock >= 0),
  popularity    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists products_audience_idx  on public.products (audience);
create index if not exists products_category_idx  on public.products (category);
create index if not exists products_price_idx     on public.products (price);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_popularity_idx on public.products (popularity desc);

-- ---------------------------------------------------------------------------
-- Saved outfits (server-side, one row per look + its items)
-- ---------------------------------------------------------------------------
create table if not exists public.saved_outfits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  total       numeric(10,2) not null default 0,
  explanation text not null default '',
  preferences jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists saved_outfits_user_idx on public.saved_outfits (user_id, created_at desc);

create table if not exists public.saved_outfit_items (
  outfit_id  uuid not null references public.saved_outfits (id) on delete cascade,
  product_id text not null references public.products (id) on update cascade,
  position   integer not null default 0,
  primary key (outfit_id, product_id)
);

create index if not exists saved_outfit_items_product_idx on public.saved_outfit_items (product_id);

-- ---------------------------------------------------------------------------
-- AI usage log (powers admin "AI requests" stats)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  kind       public.ai_kind not null,
  prompt     text not null default '',
  source     public.ai_source not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_history_created_at_idx on public.ai_history (created_at desc);
create index if not exists ai_history_user_idx on public.ai_history (user_id);

-- ---------------------------------------------------------------------------
-- Affiliate clicks
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_clicks (
  id           uuid primary key default gen_random_uuid(),
  product_id   text references public.products (id) on delete set null,
  product_name text not null default '',
  user_id      uuid references auth.users (id) on delete set null,
  user_email   text,
  source       text not null default 'direct',
  created_at   timestamptz not null default now()
);

create index if not exists affiliate_clicks_created_at_idx on public.affiliate_clicks (created_at desc);
create index if not exists affiliate_clicks_product_idx on public.affiliate_clicks (product_id);

-- ---------------------------------------------------------------------------
-- Marketing + support inboxes
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null default '',
  message    text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Only needed if you keep the custom credential auth instead of Supabase Auth.
create table if not exists public.password_resets (
  token      text primary key,
  email      text not null,
  expires_at timestamptz not null
);

create index if not exists password_resets_email_idx on public.password_resets (email);

-- ---------------------------------------------------------------------------
-- Smart Closet (private to each user)
-- ---------------------------------------------------------------------------
create table if not exists public.wardrobe_collections (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.wardrobe_items (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  category   text not null check (category in (
    'Tops', 'Shirts', 'T-shirts', 'Pants', 'Jeans', 'Shorts',
    'Jackets', 'Shoes', 'Accessories', 'Ethnic wear'
  )),
  color      text not null,
  brand      text not null default '',
  price      numeric(10,2) not null check (price >= 0),
  size       text not null default '',
  style      text not null check (style in (
    'Minimal', 'Streetwear', 'Formal', 'Casual', 'Traditional', 'Smart Casual'
  )),
  season     text not null check (season in ('Summer', 'Monsoon', 'Winter', 'All-season')),
  audience   text not null check (audience in ('Men', 'Women', 'Unisex')),
  image      text not null default '',
  notes      text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists wardrobe_items_user_idx on public.wardrobe_items (user_id, created_at desc);

create table if not exists public.wardrobe_outfits (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  description   text not null default '',
  occasion      text not null,
  style         text not null,
  season        text not null,
  total         numeric(10,2) not null default 0,
  why           text not null default '',
  suitability   text not null default '',
  tips          text not null default '',
  favorite      boolean not null default false,
  collection_id text references public.wardrobe_collections (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists wardrobe_outfits_user_idx on public.wardrobe_outfits (user_id, created_at desc);

create table if not exists public.wardrobe_outfit_items (
  outfit_id text not null references public.wardrobe_outfits (id) on delete cascade,
  item_id   text not null references public.wardrobe_items (id) on delete cascade,
  position  integer not null default 0,
  primary key (outfit_id, item_id)
);

create table if not exists public.wardrobe_planner (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  outfit_id  text not null references public.wardrobe_outfits (id) on delete cascade,
  note       text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists wardrobe_planner_user_idx on public.wardrobe_planner (user_id, date);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.brands             enable row level security;
alter table public.products           enable row level security;
alter table public.saved_outfits      enable row level security;
alter table public.saved_outfit_items enable row level security;
alter table public.ai_history         enable row level security;
alter table public.affiliate_clicks   enable row level security;
alter table public.contact_messages   enable row level security;
alter table public.newsletter_signups enable row level security;
alter table public.password_resets    enable row level security;
alter table public.wardrobe_items        enable row level security;
alter table public.wardrobe_collections  enable row level security;
alter table public.wardrobe_outfits      enable row level security;
alter table public.wardrobe_outfit_items enable row level security;
alter table public.wardrobe_planner      enable row level security;

-- Profiles: read your own, admins read all. Update only your own row.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Role escalation guard: clients may edit name/preferences, never "role".
-- A trigger is used instead of a column REVOKE because Supabase grants
-- table-level UPDATE, which a column-level REVOKE would not remove.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change a role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update of role on public.profiles
  for each row execute function public.guard_profile_role();

-- Catalogue: public read, admin write.
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (true);
drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists brands_read on public.brands;
create policy brands_read on public.brands for select using (true);
drop policy if exists brands_write on public.brands;
create policy brands_write on public.brands
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (true);
drop policy if exists products_write on public.products;
create policy products_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Saved outfits: owner-only, admins may read.
drop policy if exists saved_outfits_owner on public.saved_outfits;
create policy saved_outfits_owner on public.saved_outfits
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

drop policy if exists saved_outfit_items_owner on public.saved_outfit_items;
create policy saved_outfit_items_owner on public.saved_outfit_items
  for all using (
    exists (
      select 1 from public.saved_outfits o
      where o.id = outfit_id and (o.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.saved_outfits o
      where o.id = outfit_id and o.user_id = auth.uid()
    )
  );

-- AI history: users insert/read their own, admins read all.
drop policy if exists ai_history_select on public.ai_history;
create policy ai_history_select on public.ai_history
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists ai_history_insert on public.ai_history;
create policy ai_history_insert on public.ai_history
  for insert with check (user_id = auth.uid() or user_id is null);

-- Affiliate clicks: written only by the server (service role) in /go/:id,
-- readable by admins. No INSERT policy exists on purpose so a browser
-- holding the anon key cannot forge clicks and inflate the statistics.
drop policy if exists affiliate_clicks_admin_read on public.affiliate_clicks;
create policy affiliate_clicks_admin_read on public.affiliate_clicks
  for select using (public.is_admin());

drop policy if exists affiliate_clicks_insert on public.affiliate_clicks;

-- Contact + newsletter: anyone may submit, only admins may read.
drop policy if exists contact_insert on public.contact_messages;
create policy contact_insert on public.contact_messages for insert with check (true);
drop policy if exists contact_admin_read on public.contact_messages;
create policy contact_admin_read on public.contact_messages for select using (public.is_admin());

drop policy if exists newsletter_insert on public.newsletter_signups;
create policy newsletter_insert on public.newsletter_signups for insert with check (true);
drop policy if exists newsletter_admin_read on public.newsletter_signups;
create policy newsletter_admin_read on public.newsletter_signups for select using (public.is_admin());

-- Smart Closet: strictly owner-only, with no admin read policy (a wardrobe
-- is private personal data even from site staff).
drop policy if exists wardrobe_items_owner on public.wardrobe_items;
create policy wardrobe_items_owner on public.wardrobe_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists wardrobe_collections_owner on public.wardrobe_collections;
create policy wardrobe_collections_owner on public.wardrobe_collections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists wardrobe_outfits_owner on public.wardrobe_outfits;
create policy wardrobe_outfits_owner on public.wardrobe_outfits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists wardrobe_outfit_items_owner on public.wardrobe_outfit_items;
create policy wardrobe_outfit_items_owner on public.wardrobe_outfit_items
  for all using (
    exists (
      select 1 from public.wardrobe_outfits o
      join public.wardrobe_items i on i.id = item_id
      where o.id = outfit_id and o.user_id = auth.uid() and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.wardrobe_outfits o
      join public.wardrobe_items i on i.id = item_id
      where o.id = outfit_id and o.user_id = auth.uid() and i.user_id = auth.uid()
    )
  );

drop policy if exists wardrobe_planner_owner on public.wardrobe_planner;
create policy wardrobe_planner_owner on public.wardrobe_planner
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Password resets are service-role only: no policies are intentionally added.

-- ===========================================================================
-- Bootstrap an admin after creating the user in Supabase Auth
-- ===========================================================================
-- update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
