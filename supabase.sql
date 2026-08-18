create extension if not exists pgcrypto;

create table if not exists public.products(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric not null,
  old_price numeric default 0,
  stock integer default 0,
  image_url text,
  active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.banners(
  id uuid primary key default gen_random_uuid(),
  desktop_url text,
  mobile_url text,
  active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.orders(
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text,
  phone text not null,
  city text not null,
  district text not null,
  address text not null,
  total numeric not null,
  status text default 'Talep Formu Bekleniyor',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Mevcut orders tablosunu kullanan projeler için yeni talep alanları.
alter table public.orders add column if not exists request_name text;
alter table public.orders add column if not exists request_number text;
alter table public.orders add column if not exists tk_date text;
alter table public.orders add column if not exists moruk_code text;

do $$ begin
  alter table public.orders add constraint orders_request_number_format
    check (request_number is null or request_number ~ '^[0-9]{18}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_moruk_code_format
    check (moruk_code is null or moruk_code ~ '^[0-9]{4}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_tk_date_format
    check (tk_date is null or tk_date ~ '^(0[1-9]|1[0-2])/[0-9]{2}$');
exception when duplicate_object then null; end $$;

insert into storage.buckets(id,name,public)
values('site-media','site-media',true)
on conflict(id) do update set public=true;

alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.orders enable row level security;

do $$ begin
  create policy "public read products" on public.products for select using(true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read banners" on public.banners for select using(true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public create order" on public.orders for insert with check(true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public media read" on storage.objects for select using(bucket_id='site-media');
exception when duplicate_object then null; end $$;

create table if not exists public.visitor_sessions(
  session_id text primary key,
  stage text not null default 'browsing',
  cart_count integer not null default 0,
  cart_total numeric not null default 0,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Eski payment aşaması varsa talep aşamasına çevir ve kontrolü yenile.
update public.visitor_sessions set stage='request' where stage='payment';
alter table public.visitor_sessions drop constraint if exists visitor_sessions_stage_check;
alter table public.visitor_sessions add constraint visitor_sessions_stage_check
  check (stage in ('browsing','cart','checkout','request'));

create index if not exists visitor_sessions_last_seen_idx on public.visitor_sessions(last_seen desc);
alter table public.visitor_sessions enable row level security;


-- Talep formu başlıkları ve 4 logo alanı
create table if not exists public.request_form_settings(
  id integer primary key default 1 check (id=1),
  request_title text not null default 'Talep Formu',
  request_section_title text not null default 'Talep Bilgileri',
  request_intro text not null default 'Aşağıdaki alanları eksiksiz doldurun.',
  label_name text not null default 'Talep Edenin Adı Soyadı',
  label_number text not null default 'Talep Numarası',
  label_tk text not null default 'TK',
  label_moruk text not null default 'MORUK',
  logo1_url text default '',
  logo2_url text default '',
  logo3_url text default '',
  logo4_url text default '',
  updated_at timestamptz not null default now()
);
insert into public.request_form_settings(id) values(1) on conflict(id) do nothing;
alter table public.request_form_settings enable row level security;
do $$ begin
  create policy "public read request settings" on public.request_form_settings for select using(true);
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
