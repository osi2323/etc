-- KARACA V4: Teslimat sayfası butonu + ürün özeti ayarları
-- Supabase > SQL Editor > New query > Run

alter table public.request_form_settings add column if not exists delivery_cart_title text not null default 'Sipariş Özeti';
alter table public.request_form_settings add column if not exists delivery_button_text text not null default 'Talep Formuna Geç';

notify pgrst, 'reload schema';
