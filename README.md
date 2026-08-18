# Karaca Shop Starter

Next.js + Supabase + Vercel için hazırlanmış responsive mağaza başlangıcı.

## Hazır olanlar
- Responsive ana sayfa ve 4 banner alanı (PC + mobil görsel)
- Ürün kartları, ürün detay, sepet, Hemen Al
- Misafir teslimat formu ve Supabase sipariş kaydı
- Koyu footer ve ödeme/güven alanı
- Admin ürün/banner ekranı
- Güvenli ödeme entegrasyon noktası (kart numarası/CVV uygulama tarafından toplanmaz)

## Kurulum
1. Supabase projesi oluştur ve `supabase.sql` dosyasını SQL Editor'da çalıştır.
2. `.env.example` dosyasını `.env.local` olarak kopyala ve Supabase URL/publishable key değerlerini gir.
3. `npm install` ve `npm run dev`.
4. GitHub'a push et, Vercel'de repo'yu import et ve aynı environment variable'ları ekle.

## Ödeme
Canlı ödeme için iyzico, PayTR, Stripe vb. PCI uyumlu sağlayıcının hosted checkout/tokenized fields çözümünü ödeme ekranına bağla. Tam kart numarası ve CVV Supabase'e veya admin paneline kaydedilmemelidir.

## Canlıya geçmeden önce
`/admin` için Supabase Auth veya başka bir admin kimlik doğrulaması ekle ve ürün/banner yazma işlemlerini server-side yetkilendir. RLS politikalarını production ihtiyaçlarına göre sıkılaştır.


## Canlı ziyaretçi hunisi
Admin paneli artık anonim ziyaretçi aşamalarını gösterir: geziyor, sepette, adres/teslimat ve ödeme noktasında.
`visitor_sessions` tablosu kişisel bilgi veya kart verisi tutmaz; yalnızca rastgele oturum kimliği, aşama, sepet adedi/tutarı ve son görülme zamanını tutar.

Vercel Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ADMIN_DASHBOARD_TOKEN` (uzun rastgele bir secret)

Supabase SQL Editor'da güncel `supabase.sql` dosyasını çalıştır. Admin panelinde canlı bölüm açıldığında `ADMIN_DASHBOARD_TOKEN` değerini gir.


## Admin müşteri / ödeme özeti
Admin paneli siparişlerden ad-soyad ve telefonu gösterir. Ödeme sağlayıcısı entegrasyonu yapıldığında yalnızca sağlayıcının güvenli olarak döndürdüğü kart markası, son 4 hane ve son kullanma ay/yıl özeti orders tablosuna yazılabilir. Tam kart numarası ve CVV saklanmaz; CVV sütununda yalnızca sabit `***` gösterilir.


## PayTR kart ödeme entegrasyonu
Bu sürümde ödeme ekranı PayTR iFrame API ile bağlanmıştır. Kart numarası, son kullanma tarihi ve CVV PayTR'nin güvenli iframe alanında girilir; uygulama veya Supabase bu hassas kart verilerini almaz. Vercel Environment Variables bölümüne PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY ve PAYTR_MERCHANT_SALT ekleyin. İlk kurulumda PAYTR_TEST_MODE=1 ve PAYTR_DEBUG_ON=1 kullanın. PayTR mağaza panelinde Callback URL olarak `https://ALAN-ADINIZ/api/paytr/callback` tanımlayın. Supabase SQL Editor'da güncel supabase.sql dosyasını tekrar çalıştırın.


## Admin kart özeti formatı
Admin panelinde kayıt şu formatta gösterilir:

`Ad Soyad | Telefon | Kart •••• •••• •••• 1234 | Ay/Yıl 08/29 | CVV ***`

- Veritabanında yalnızca `card_last4` (4 rakam), `card_brand` ve `card_expiry` (AA/YY) alanları bulunur.
- Gerçek CVV için kolon yoktur; admin panelindeki `***` sabit metindir.
- Tam kart numarası için kolon yoktur.
- `/api/payment-summary` yalnızca sunucu-sunucu güvenli ödeme özeti güncellemesi içindir; tam PAN/CVV alanlarını reddeder ve `PAYMENT_SUMMARY_SECRET` ister.
