# Karaca Shop – V2 Admin + Sepet + Talep Formu

Bu paket tam proje sürümüdür.

## Bu sürümde eklenenler

- Ana sayfada sağ altta mobil uyumlu sabit sepet butonu ve ürün adedi.
- Talep Formu sayfasında seçilen ürünlerin görseli, adı, birim fiyatı, adet miktarı ve satır toplamı.
- Talep Formu içinden `+ / -` ile ürün adedi değiştirme ve ürünü kaldırma.
- Talep gönderildiğinde son sepet adedi ve toplam tutar `orders.items` / `orders.total` alanına güncel olarak yazılır.
- Admin panelinde gelişmiş canlı mağaza görünümü, ziyaretçi hunisi ve hareket listesi.
- Admin panelinde talepleri tek tek seçerek toplu silme veya tüm talepleri temizleme.
- `Talep Sayfası Metinleri ve Logoları` yönetim alanı.
- Talep sayfasındaki başlık, placeholder/kutu içi yazı, alt açıklama, buton yazısı ve 4 logo admin panelinden düzenlenebilir.
- Talep Numarası zorunlu hane sayısı admin panelinden 1–32 arasında seçilebilir.
- MORUK zorunlu hane sayısı admin panelinden 1–12 arasında seçilebilir.
- 7 adet başlangıç / Çok Satan ürün admin girişinde otomatik olarak `products` tablosuna eklenir.
- Ürün, banner ve logo yüklemeleri `ADMIN_DASHBOARD_TOKEN` korumalı sunucu API'lerinden ve Supabase service role üzerinden yapılır.
- Mobil admin, mobil sepet, mobil talep ürün özeti ve mobil banner swipe iyileştirmeleri.

## Mevcut Supabase projesini güncelliyorsan

Supabase > SQL Editor > New query aç ve bu dosyayı BİR KEZ çalıştır:

`supabase-v2-admin-sepet.sql`

Bu dosya mevcut talepleri silmez. Yeni talep ayar sütunlarını ekler ve eski sabit 18/4 hane constraintlerini dinamik yapıya uygun hale getirir.

## Yeni Supabase projesi kuruyorsan

`supabase.sql` dosyasını çalıştırman yeterli. V2 güncellemeleri dosyanın sonunda dahil edilmiştir.

## Vercel Environment Variables

Aşağıdaki değerler bulunmalıdır:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DASHBOARD_TOKEN`

Environment Variables güncellendikten sonra Vercel'de yeniden deploy et.

## Admin

`/admin` adresine gir. `ADMIN_DASHBOARD_TOKEN` değerini şifre olarak kullan.

## V3 güncellemesi
- Talep sonrası bildirim ekranı admin panelinden özelleştirilebilir: ikon, başlık, açıklama ve buton metni.
- Ana sayfadaki kategori satırı kaldırıldı; yerine mobil uyumlu "Haftanın Kampanyaları" kayan yazı şeridi eklendi.
- Kayan yazı başlığı ve 3 kampanya mesajı admin panelinden düzenlenebilir.
- Büyük banner / ürün / logo görsellerinin mobilde sayfayı yatay genişletmesini önleyen ek responsive kurallar eklendi.
- Bu sürüme geçerken `supabase-v3-kampanya-bildirim.sql` dosyasını bir kez çalıştırın.
