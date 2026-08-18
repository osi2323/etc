-- Bu dosyayı mevcut Supabase projesinde SQL Editor > New query içinde bir kez çalıştır.
-- Mevcut verileri silmez.

alter table public.orders add column if not exists moruk_code text;

do $$ begin
  alter table public.orders add constraint orders_moruk_code_format
    check (moruk_code is null or moruk_code ~ '^[0-9]{4}$');
exception when duplicate_object then null; end $$;

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
  create policy "public read request settings" on public.request_form_settings
  for select using(true);
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
