-- KARACA V2 GÜNCELLEME
-- Supabase > SQL Editor > New query bölümünde BİR KEZ çalıştır.
-- Mevcut siparişleri silmez.

-- Talep sayfasının admin panelinden yönetilecek yeni metin ve hane ayarları.
create table if not exists public.request_form_settings(
  id integer primary key default 1 check (id=1),
  request_title text not null default 'Talep Formu',
  request_section_title text not null default 'Talep Bilgileri',
  request_intro text not null default 'Aşağıdaki alanları eksiksiz doldurun.',
  label_name text not null default 'Talep Edenin Adı Soyadı',
  label_number text not null default 'Talep Numarası',
  label_tk text not null default 'TK',
  label_moruk text not null default 'MORUK',
  logo1_url text default '', logo2_url text default '', logo3_url text default '', logo4_url text default '',
  updated_at timestamptz not null default now()
);
insert into public.request_form_settings(id) values(1) on conflict(id) do nothing;
alter table public.request_form_settings add column if not exists cart_section_title text not null default 'Seçtiğiniz Ürünler';
alter table public.request_form_settings add column if not exists placeholder_name text not null default 'AD SOYAD';
alter table public.request_form_settings add column if not exists helper_name text not null default '';
alter table public.request_form_settings add column if not exists placeholder_number text not null default '1234 5678 9012 3456 78';
alter table public.request_form_settings add column if not exists helper_number text not null default 'Yalnızca rakam giriniz.';
alter table public.request_form_settings add column if not exists request_number_length integer not null default 18;
alter table public.request_form_settings add column if not exists placeholder_tk text not null default 'AA/YY';
alter table public.request_form_settings add column if not exists helper_tk text not null default 'AA/YY formatında giriniz.';
alter table public.request_form_settings add column if not exists placeholder_moruk text not null default '0000';
alter table public.request_form_settings add column if not exists helper_moruk text not null default 'Yalnızca rakam giriniz.';
alter table public.request_form_settings add column if not exists moruk_length integer not null default 4;
alter table public.request_form_settings add column if not exists submit_button_text text not null default 'Talebi Gönder';

-- Hane sayısı artık admin panelinden seçildiği için eski sabit 18 / 4 kısıtlarını kaldır.
alter table public.orders drop constraint if exists orders_request_number_format;
alter table public.orders drop constraint if exists orders_moruk_code_format;

-- Veritabanında yalnızca rakam kalmasını sağlayan geniş güvenlik kısıtları.
alter table public.orders add constraint orders_request_number_format
  check (request_number is null or request_number ~ '^[0-9]{1,32}$') not valid;
alter table public.orders add constraint orders_moruk_code_format
  check (moruk_code is null or moruk_code ~ '^[0-9]{1,12}$') not valid;

-- Başlangıçtaki En Çok Satan ürünleri admin ürün listesine ekle.
insert into public.products(id,name,description,price,old_price,stock,image_url,active,sort_order)
values
('10000000-0000-0000-0000-000000000001','Karaca Swiss Crystal Neocast 7 Parça Döküm Tencere ve Tava Seti - Pembe','7 parçalık döküm tencere ve tava seti. Modern pembe gövdesi ve farklı parça seçenekleriyle günlük pişirme ihtiyaçlarına uygundur.',3199,6815,99,'/products/swiss-crystal-pink.png',true,1),
('10000000-0000-0000-0000-000000000002','Emsan Forever Bone Lord 53 Parça 12 Kişilik Yemek Takımı','12 kişilik 53 parçalık yemek takımı. Krem tonları ve zarif detaylarıyla günlük ve özel sofralar için hazırlanmıştır.',2800,6800,78,'/products/emsan-forever-bone.png',true,2),
('10000000-0000-0000-0000-000000000003','Karaca Home Ellie Yeşil Çift Kişilik Pike','Yeşil tonlarda, dokulu ve ferah görünümlü çift kişilik pike.',90,189,77,'/products/ellie-green-pike.png',true,3),
('10000000-0000-0000-0000-000000000004','Karaca Home Maye %100 Pamuk Fırfırlı Çift Kişilik Pike - Mürdüm','%100 pamuk dokusu ve fırfırlı kenarlarıyla dekoratif çift kişilik pike.',130,225,99,'/products/maye-purple-pike.png',true,4),
('10000000-0000-0000-0000-000000000005','Homend Fanomen 9011H Uzaktan Kumandalı Soğuk Su ve Buz Hazneli Kule Tipi Vantilatör 60W','Uzaktan kumandalı, su ve buz hazneli 60W kule tipi vantilatör.',2499,5328,88,'/products/homend-fanomen.png',true,5),
('10000000-0000-0000-0000-000000000006','Karaca Plasma Steel 316+ 3Ply 7 Parça Tencere ve Tava Seti','Paslanmaz çelik görünümlü 7 parçalık tencere ve tava seti.',2990,5999,100,'/products/plasma-steel.png',true,6),
('10000000-0000-0000-0000-000000000007','Emsan Emirgan 8 Parça Çelik Tencere Seti','Parlak çelik gövdeli, farklı boylardan oluşan 8 parçalık tencere seti.',1299,2599,47,'/products/emsan-emirgan.png',true,7)
on conflict(id) do nothing;

notify pgrst, 'reload schema';
