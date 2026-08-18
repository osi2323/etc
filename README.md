# Karaca Shop - Talep Formu Sürümü

Next.js + Supabase + Vercel tabanlı mağaza demosu.

## Akış
1. Sepet
2. Teslimat Bilgileri
3. Talep Formu
4. Onay

Talep formu alanları:
- Talep Edenin Adı Soyadı
- Talep Numarası: yalnızca rakam, tam 18 hane; ekranda 4'lü gruplar halinde gösterilir.
- TK: AA/YY formatında 4 rakam; ay 01-12 aralığında olmalıdır.

Talep bilgileri `orders` tablosundaki `request_name`, `request_number` ve `tk_date` alanlarına kaydedilir. Admin panelinde Talep Kayıtları bölümünde görünür.

## Supabase
Supabase SQL Editor'da bu paketin içindeki `supabase.sql` dosyasını çalıştırın. Script mevcut tabloları silmez; yeni talep alanlarını `add column if not exists` ile ekler.

## Vercel Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DASHBOARD_TOKEN`

Environment variable değişikliklerinden sonra Vercel'de Redeploy yapın.

## Son güncelleme: teslimat + talep formu yönetimi
- Teslimat alanlarında görünür başlıklar eklendi; e-posta kaldırıldı.
- Telefon alanı Türkiye cep telefonu biçiminde otomatik formatlanır: `0 (5xx) xxx xx xx`.
- Talep formuna 4 haneli yalnızca rakam kabul eden `MORUK` alanı eklendi.
- Talep formunda 4 adet mobil uyumlu logo alanı bulunur.
- Admin panelinden talep formu sayfa/bölüm/alan başlıkları değiştirilebilir.
- Admin panelinden dört logo yüklenebilir.
- Mevcut Supabase projesinde `supabase-talep-guncelleme.sql` dosyasını SQL Editor'da çalıştırın.
