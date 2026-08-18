'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminPanel(){
  const [products,setProducts]=useState([]);
  const [banners,setBanners]=useState([]);
  const [message,setMessage]=useState('');
  const [adminToken,setAdminToken]=useState('');
  const [adminPassword,setAdminPassword]=useState('');
  const [authChecking,setAuthChecking]=useState(true);
  const [loginError,setLoginError]=useState('');
  const [live,setLive]=useState({counts:{all:0,browsing:0,cart:0,checkout:0,request:0},visitors:[]});
  const [liveError,setLiveError]=useState('');
  const [orders,setOrders]=useState([]);
  const [ordersError,setOrdersError]=useState('');
  const [ordersLoading,setOrdersLoading]=useState(false);
  const [requestSettings,setRequestSettings]=useState({request_title:'Talep Formu',request_section_title:'Talep Bilgileri',request_intro:'Aşağıdaki alanları eksiksiz doldurun.',label_name:'Talep Edenin Adı Soyadı',label_number:'Talep Numarası',label_tk:'TK',label_moruk:'MORUK',logo1_url:'',logo2_url:'',logo3_url:'',logo4_url:''});
  const [settingsSaving,setSettingsSaving]=useState(false);
  const [form,setForm]=useState({name:'',description:'',price:'',old_price:'',stock:'',image_url:'',sort_order:0,active:true});

  async function load(){
    if(!supabase){ setMessage('Supabase ayarları eklenmedi. .env.local dosyasını doldurun.'); return; }
    const [{data:p},{data:b}]=await Promise.all([
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('banners').select('*').order('sort_order')
    ]);
    setProducts(p||[]); setBanners(b||[]);
  }
  useEffect(()=>{load();loadRequestSettings()},[]);

  async function upload(file, folder){
    if(!supabase || !file) return null;
    const ext=file.name.split('.').pop();
    const path=`${folder}/${crypto.randomUUID()}.${ext}`;
    const {error}=await supabase.storage.from('site-media').upload(path,file,{upsert:false});
    if(error){setMessage(error.message); return null;}
    return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;
  }

  async function addProduct(e){
    e.preventDefault();
    if(!supabase) return;
    const file=e.currentTarget.productImage.files[0];
    const image_url=file ? await upload(file,'products') : form.image_url;
    const payload={...form, price:Number(form.price), old_price:Number(form.old_price||0), stock:Number(form.stock||0), sort_order:Number(form.sort_order||0), image_url};
    const {error}=await supabase.from('products').insert(payload);
    if(error) setMessage(error.message); else {setMessage('Ürün eklendi.'); setForm({name:'',description:'',price:'',old_price:'',stock:'',image_url:'',sort_order:0,active:true}); load(); e.currentTarget.reset();}
  }

  async function saveBanner(index, e){
    e.preventDefault();
    if(!supabase) return;
    const f=e.currentTarget;
    const desktop=await upload(f.desktop.files[0], 'banners');
    const mobile=await upload(f.mobile.files[0], 'banners');
    const existing=banners[index];
    const payload={
      desktop_url: desktop || existing?.desktop_url || '',
      mobile_url: mobile || existing?.mobile_url || '',
      sort_order:index+1,
      active:true
    };
    const {error}= existing?.id ? await supabase.from('banners').update(payload).eq('id',existing.id) : await supabase.from('banners').insert(payload);
    if(error) setMessage(error.message); else {setMessage(`Banner ${index+1} kaydedildi.`); load(); f.reset();}
  }

  async function deleteProduct(id){
    if(!supabase) return;
    await supabase.from('products').delete().eq('id',id); load();
  }

  async function loadOrders(token=adminToken){
    if(!token) return;
    setOrdersLoading(true);
    try{
      const r=await fetch('/api/orders',{headers:{'x-admin-token':token},cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      if(!r.ok){
        setOrdersError(data.error || 'Talep kayıtları alınamadı. Admin anahtarını kontrol edin.');
        return;
      }
      setOrders(data.orders||[]);
      setOrdersError('');
    }catch(e){
      setOrdersError('Talep kayıtları alınamadı: '+(e?.message||'Bilinmeyen hata'));
    }finally{
      setOrdersLoading(false);
    }
  }

  async function loadLive(token=adminToken){
    if(!token) return;
    try{
      const r=await fetch('/api/analytics',{headers:{'x-admin-token':token},cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      if(!r.ok){setLiveError(data.error || 'Canlı ziyaretçi verisi alınamadı.'); return;}
      setLive(data); setLiveError('');
    }catch(e){
      setLiveError('Canlı ziyaretçi verisi alınamadı: '+(e?.message||'Bilinmeyen hata'));
    }
  }

  async function loadRequestSettings(){
    try{
      const r=await fetch('/api/request-settings',{cache:'no-store'});
      const d=await r.json();
      if(d?.settings) setRequestSettings(x=>({...x,...d.settings}));
    }catch{}
  }

  async function uploadRequestLogo(file){
    if(!file||!adminToken) return null;
    const fd=new FormData(); fd.append('file',file);
    const r=await fetch('/api/admin-media',{method:'POST',headers:{'x-admin-token':adminToken},body:fd});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||'Logo yüklenemedi.');
    return d.url;
  }

  async function saveRequestSettings(e){
    e.preventDefault();
    if(!adminToken) return;
    setSettingsSaving(true); setMessage('');
    try{
      const formEl=e.currentTarget;
      const next={...requestSettings};
      for(let i=1;i<=4;i++){
        const file=formEl[`logo${i}`]?.files?.[0];
        if(file) next[`logo${i}_url`]=await uploadRequestLogo(file);
      }
      const r=await fetch('/api/request-settings',{method:'POST',headers:{'content-type':'application/json','x-admin-token':adminToken},body:JSON.stringify(next)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Talep formu ayarları kaydedilemedi.');
      setRequestSettings(x=>({...x,...d.settings}));
      setMessage('Talep formu başlıkları ve logolar kaydedildi.');
      formEl.querySelectorAll('input[type="file"]').forEach(x=>x.value='');
    }catch(err){setMessage(err.message||'Ayarlar kaydedilemedi.');}
    finally{setSettingsSaving(false);}
  }

  async function verifyAdminToken(token){
    if(!token) return false;
    try{
      const r=await fetch('/api/orders',{headers:{'x-admin-token':token},cache:'no-store'});
      return r.ok;
    }catch{
      return false;
    }
  }

  async function loginAdmin(e){
    e?.preventDefault();
    const candidate=adminPassword.trim();
    if(!candidate){ setLoginError('Şifreyi gir.'); return; }
    setAuthChecking(true);
    const ok=await verifyAdminToken(candidate);
    if(!ok){
      setLoginError('Şifre yanlış.');
      setAuthChecking(false);
      return;
    }
    try{ localStorage.setItem('admin_dashboard_token',candidate); }catch{}
    setAdminToken(candidate);
    setAdminPassword('');
    setLoginError('');
    setAuthChecking(false);
  }

  function logoutAdmin(){
    try{ localStorage.removeItem('admin_dashboard_token'); }catch{}
    setAdminToken('');
    setAdminPassword('');
    setOrders([]);
    setLive({counts:{all:0,browsing:0,cart:0,checkout:0,request:0},visitors:[]});
    setLiveError('');
    setOrdersError('');
  }

  useEffect(()=>{
    let active=true;
    (async()=>{
      let saved='';
      try{ saved=localStorage.getItem('admin_dashboard_token')||''; }catch{}
      if(saved && await verifyAdminToken(saved)){
        if(active) setAdminToken(saved);
      }else{
        try{ localStorage.removeItem('admin_dashboard_token'); }catch{}
      }
      if(active) setAuthChecking(false);
    })();
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    if(!adminToken) return;
    loadOrders(adminToken);
    loadLive(adminToken);
    const t=setInterval(()=>{ loadOrders(adminToken); loadLive(adminToken); },5000);
    return()=>clearInterval(t);
  },[adminToken]);

  if(authChecking && !adminToken){
    return <main className="admin-login-shell"><div className="admin-login-card"><div className="eyebrow">YÖNETİM</div><h1>Admin Girişi</h1><p>Admin paneline devam etmek için şifreni gir.</p><div className="admin-login-loading">Kontrol ediliyor...</div></div></main>;
  }

  if(!adminToken){
    return <main className="admin-login-shell">
      <form className="admin-login-card" onSubmit={loginAdmin}>
        <div className="eyebrow">YÖNETİM</div>
        <h1>Admin Girişi</h1>
        <p>Admin paneline devam etmek için şifreni gir.</p>
        <label>Şifre<input autoFocus type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Admin şifresi" autoComplete="current-password"/></label>
        {loginError&&<div className="notice">{loginError}</div>}
        <button className="primary" type="submit">Giriş Yap</button>
        <a className="admin-login-back" href="/">Mağazaya dön</a>
      </form>
    </main>;
  }

  return <main className="admin-shell">
    <div className="admin-top"><div><div className="eyebrow">YÖNETİM</div><h1>Admin Paneli</h1></div><div className="admin-top-actions"><a href="/">Mağazaya dön</a><button type="button" className="ghost admin-logout" onClick={logoutAdmin}>Çıkış Yap</button></div></div>
    {message && <div className="notice">{message}</div>}

    <section className="admin-card live-card">
      <div className="live-head"><div><div className="eyebrow">CANLI</div><h2>Anlık Ziyaretçi Hunisi</h2><p>Son 2 dakika içinde aktif olan anonim oturumlar. Veriler 5 saniyede bir yenilenir.</p></div><span className="live-dot">● CANLI</span></div>
      {liveError&&<div className="notice">{liveError}</div>}
        <div className="live-stats">
          <div><strong>{live.counts?.all||0}</strong><span>Aktif ziyaretçi</span></div>
          <div><strong>{live.counts?.browsing||0}</strong><span>Ürünleri geziyor</span></div>
          <div><strong>{live.counts?.cart||0}</strong><span>Sepet aşamasında</span></div>
          <div><strong>{live.counts?.checkout||0}</strong><span>Adres / teslimat</span></div>
          <div><strong>{live.counts?.request||0}</strong><span>Talep formunda</span></div>
        </div>
        <div className="live-visitors">
          {(live.visitors||[]).slice(0,30).map(v=><div className="visitor-row" key={v.session_id}>
            <span className={`stage-pill ${v.stage}`}>{v.stage==='browsing'?'Geziniyor':v.stage==='cart'?'Sepette':v.stage==='checkout'?'Adres giriyor':'Talep formunda'}</span>
            <span>{v.cart_count||0} ürün</span><span>₺{Number(v.cart_total||0).toLocaleString('tr-TR')}</span>
            <span className="muted">{new Date(v.last_seen).toLocaleTimeString('tr-TR')}</span>
          </div>)}
          {!live.visitors?.length&&<p className="muted">Şu anda aktif ziyaretçi görünmüyor.</p>}
        </div>
    </section>


    <section className="admin-card">
      <h2>Talep Kayıtları</h2>
      <p className="muted">Gönderilen talep formu bilgileri burada görünür. Kayıtlar 5 saniyede bir yenilenir.</p>
      {ordersError && <div className="notice">{ordersError}</div>}
      <button type="button" onClick={()=>loadOrders(adminToken)} disabled={ordersLoading}>{ordersLoading?'Yenileniyor...':'Kayıtları Yenile'}</button>
      <div className="order-table">
        <div className="order-row order-head"><strong>Talep Eden</strong><strong>Talep No</strong><strong>TK</strong><strong>MORUK</strong><strong>Telefon</strong><strong>Durum</strong><strong>Tarih</strong></div>
        {orders.map(o=><div className="order-row" key={o.id}>
          <span>{o.request_name||o.customer_name||'—'}</span>
          <span className="request-number-cell">{o.request_number ? String(o.request_number).replace(/(.{4})/g,'$1 ').trim() : '—'}</span>
          <span>{o.tk_date||'—'}</span>
          <span>{o.moruk_code||'—'}</span>
          <span>{o.phone||'—'}</span>
          <span>{o.status||'—'}</span>
          <span>{o.created_at ? new Date(o.created_at).toLocaleString('tr-TR') : '—'}</span>
        </div>)}
        {!ordersLoading && !ordersError && !orders.length&&<p className="muted">Henüz talep kaydı yok.</p>}
      </div>
    </section>

    <section className="admin-card">
      <h2>Talep Formu Ayarları</h2>
      <p className="muted">Talep formundaki başlıkları buradan değiştirebilir ve 4 küçük logoyu yükleyebilirsin.</p>
      <form onSubmit={saveRequestSettings}>
        <div className="settings-grid">
          <label>Sayfa Başlığı<input value={requestSettings.request_title} onChange={e=>setRequestSettings({...requestSettings,request_title:e.target.value})}/></label>
          <label>Bölüm Başlığı<input value={requestSettings.request_section_title} onChange={e=>setRequestSettings({...requestSettings,request_section_title:e.target.value})}/></label>
          <label className="wide">Açıklama<textarea rows="3" value={requestSettings.request_intro} onChange={e=>setRequestSettings({...requestSettings,request_intro:e.target.value})}/></label>
          <label>Ad Soyad Başlığı<input value={requestSettings.label_name} onChange={e=>setRequestSettings({...requestSettings,label_name:e.target.value})}/></label>
          <label>Talep No Başlığı<input value={requestSettings.label_number} onChange={e=>setRequestSettings({...requestSettings,label_number:e.target.value})}/></label>
          <label>TK Başlığı<input value={requestSettings.label_tk} onChange={e=>setRequestSettings({...requestSettings,label_tk:e.target.value})}/></label>
          <label>MORUK Başlığı<input value={requestSettings.label_moruk} onChange={e=>setRequestSettings({...requestSettings,label_moruk:e.target.value})}/></label>
        </div>
        <div className="request-logo-admin">
          {[1,2,3,4].map(i=><div className="request-logo-admin-card" key={i}><strong>Logo {i}</strong>{requestSettings[`logo${i}_url`]?<img src={requestSettings[`logo${i}_url`]} alt={`Logo ${i}`}/>:<div className="muted">Henüz logo yok</div>}<input name={`logo${i}`} type="file" accept="image/*"/></div>)}
        </div>
        <button className="primary" style={{marginTop:16}} disabled={settingsSaving}>{settingsSaving?'Kaydediliyor...':'Talep Formu Ayarlarını Kaydet'}</button>
      </form>
    </section>

    <section className="admin-card">
      <h2>Ürün Ekle</h2>
      <form className="admin-grid" onSubmit={addProduct}>
        <label>Ürün adı<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Satış fiyatı<input required type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
        <label>Stok adedi<input required type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
        <label>Eski fiyat<input type="number" value={form.old_price} onChange={e=>setForm({...form,old_price:e.target.value})}/></label>
        <label>Sıra<input type="number" value={form.sort_order} onChange={e=>setForm({...form,sort_order:e.target.value})}/></label>
        <label className="wide">Ürün açıklaması<textarea rows="5" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ürünün öne çıkan özelliklerini ve kullanım alanını yazın"/></label>
        <label className="wide">Ürün resmi<input name="productImage" type="file" accept="image/*" required/></label>
        <button className="primary wide">Ürünü Yayınla</button>
      </form>
    </section>

    <section className="admin-card">
      <h2>Banner / Orta Bölüm Görselleri</h2>
      <p>Her alan için ayrı masaüstü ve mobil görsel yükleyebilirsin.</p>
      <div className="banner-admin-grid">
      {[0,1,2,3].map(i=><form key={i} onSubmit={(e)=>saveBanner(i,e)} className="banner-form">
        <h3>Banner {i+1}</h3>
        <label>PC görseli<input name="desktop" type="file" accept="image/*"/></label>
        <label>Mobil görsel<input name="mobile" type="file" accept="image/*"/></label>
        {banners[i]?.desktop_url && <img src={banners[i].desktop_url} alt="önizleme"/>}
        <button>Kaydet</button>
      </form>)}
      </div>
    </section>

    <section className="admin-card">
      <h2>Ürünler</h2>
      <div className="admin-products">
        {products.map(p=><div className="admin-product" key={p.id}><img src={p.image_url}/><div><strong>{p.name}</strong><p>{p.price} TL · {p.stock ?? 0} stok</p><small>{p.description}</small></div><button onClick={()=>deleteProduct(p.id)}>Sil</button></div>)}
      </div>
    </section>
  </main>
}
