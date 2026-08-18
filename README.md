# Özel Mağaza + Ödeme Arayüzü

Next.js + Supabase + Vercel için hazırlanmış mağaza projesi.

## Hazır olanlar
- Responsive mağaza, ürün detay, sepet ve teslimat akışı
- Tamamen özel tasarımlı kart ödeme ekranı
- Ad Soyad / Telefon bilgilerinin siparişle kaydı
- Admin panelinde müşteri ve güvenli kart özeti
- Kart görünümü: `•••• •••• •••• 1234`
- Ay/Yıl görünümü: `08/29`
- CVV görünümü: yalnızca sabit `***`
- Canlı ziyaretçi hunisi

## Önemli ödeme notu
Özel ödeme ekranı arayüzü hazırdır. Kart numarası ve CVV veritabanına veya admin paneline kaydedilmez ve ödeme özeti API'sine gönderilmez. Admin paneline yalnızca kartın son 4 hanesi, kart markası ve AA/YY özeti kaydedilir.

Bu paket kendi başına banka kartından gerçek tahsilat yapmaz. Gerçek tahsilat için banka/acquirer bağlantısı veya PCI uyumlu tokenizasyon katmanı ayrıca bağlanmalıdır. Bu bağlantı daha sonra özel arayüz korunarak eklenebilir.

## Kurulum
1. Supabase SQL Editor'da `supabase.sql` dosyasını çalıştır.
2. `.env.example` dosyasını `.env.local` olarak kopyala.
3. Supabase URL, anon key ve server-only service role key değerlerini gir.
4. `npm install` ve `npm run dev`.
5. Vercel'de aynı environment variable değerlerini ekle.

## Vercel Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DASHBOARD_TOKEN`


## Footer güncellemesi
Footer içine ETBİS QR görseli ve altına ödeme yöntemleri logo şeridi eklendi. Görseller `public/etbis-qr.png` ve `public/payment-methods.png` dosyalarındadır.
