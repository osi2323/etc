create extension if not exists pgcrypto;
create table if not exists public.products(id uuid primary key default gen_random_uuid(),name text not null,description text default '',price numeric not null,old_price numeric default 0,stock integer default 0,image_url text,active boolean default true,sort_order integer default 0,created_at timestamptz default now());
create table if not exists public.banners(id uuid primary key default gen_random_uuid(),desktop_url text,mobile_url text,active boolean default true,sort_order integer default 0,created_at timestamptz default now());
create table if not exists public.orders(id uuid primary key default gen_random_uuid(),customer_name text not null,phone text not null,city text not null,district text not null,address text not null,total numeric not null,status text default 'Ödeme Bekliyor',items jsonb not null default '[]'::jsonb,created_at timestamptz default now());
insert into storage.buckets(id,name,public) values('site-media','site-media',true) on conflict(id) do update set public=true;
alter table public.products enable row level security;alter table public.banners enable row level security;alter table public.orders enable row level security;
create policy "public read products" on public.products for select using(true);create policy "public read banners" on public.banners for select using(true);
-- Production: admin writes should be done server-side with authenticated admin authorization.
create policy "public create order" on public.orders for insert with check(true);
create policy "public media read" on storage.objects for select using(bucket_id='site-media');


-- Anonymous live funnel analytics. No card data, address, phone or personal information is stored here.
create table if not exists public.visitor_sessions(
  session_id text primary key,
  stage text not null default 'browsing' check (stage in ('browsing','cart','checkout','payment')),
  cart_count integer not null default 0,
  cart_total numeric not null default 0,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists visitor_sessions_last_seen_idx on public.visitor_sessions(last_seen desc);
alter table public.visitor_sessions enable row level security;
-- No public policies: browser access is blocked. /api/analytics uses the server-only service role.


-- Safe payment summary fields. Never store full PAN or CVV.
alter table public.orders add column if not exists card_brand text;
alter table public.orders add column if not exists card_last4 text;
alter table public.orders add column if not exists card_expiry text;
