-- KARACA V3: Talep sonrası bildirim + Haftanın Kampanyaları şeridi
-- Supabase > SQL Editor > New query alanında BİR KEZ çalıştır.
-- Mevcut kayıtları silmez.

alter table public.request_form_settings add column if not exists success_icon text not null default '✅';
alter table public.request_form_settings add column if not exists success_title text not null default 'Talebiniz alındı';
alter table public.request_form_settings add column if not exists success_message text not null default 'Talep bilgileriniz başarıyla kaydedildi.';
alter table public.request_form_settings add column if not exists success_button_text text not null default 'Mağazaya Dön';

alter table public.request_form_settings add column if not exists campaign_title text not null default 'HAFTANIN KAMPANYALARI';
alter table public.request_form_settings add column if not exists campaign_message_1 text not null default 'Seçili ürünlerde fırsatları kaçırma';
alter table public.request_form_settings add column if not exists campaign_message_2 text not null default 'Çok satan ürünlerde özel fiyatlar';
alter table public.request_form_settings add column if not exists campaign_message_3 text not null default 'Stoklarla sınırlı avantajlar';

-- RLS açık kalabilir. Public taraf ayarları /api/request-settings üzerinden okur,
-- admin kaydı ise server-side service role üzerinden yapılır.
alter table public.request_form_settings enable row level security;

drop policy if exists "request_form_settings_public_read" on public.request_form_settings;
create policy "request_form_settings_public_read"
on public.request_form_settings
for select
to anon, authenticated
using (true);

notify pgrst, 'reload schema';
