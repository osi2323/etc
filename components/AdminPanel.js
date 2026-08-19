'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const defaultSettings={
  request_title:'Talep Formu',request_section_title:'Talep Bilgileri',request_intro:'Aşağıdaki alanları eksiksiz doldurun.',cart_section_title:'Seçtiğiniz Ürünler',
  label_name:'Talep Edenin Adı Soyadı',placeholder_name:'AD SOYAD',helper_name:'',
  label_number:'Talep Numarası',placeholder_number:'1234 5678 9012 3456 78',helper_number:'Yalnızca rakam giriniz.',request_number_length:18,
  label_tk:'TK',placeholder_tk:'AA/YY',helper_tk:'AA/YY formatında giriniz.',
  label_moruk:'MORUK',placeholder_moruk:'0000',helper_moruk:'Yalnızca rakam giriniz.',moruk_length:4,
  submit_button_text:'Talebi Gönder',logo1_url:'',logo2_url:'',logo3_url:'',logo4_url:''
};

const money=n=>Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:2});

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
  const [selectedOrders,setSelectedOrders]=useState([]);
  const [ordersError,setOrdersError]=useState('');
  const [ordersLoading,setOrdersLoading]=useState(false);
  const [requestSettings,setRequestSettings]=useState(defaultSettings);
  const [settingsSaving,setSettingsSaving]=useState(false);
  const [form,setForm]=useState({name:'',description:'',price:'',old_price:'',stock:'',image_url:'',sort_order:0,active:true});
  const [editingProduct,setEditingProduct]=useState(null);

  const completedCount=useMemo(()=>orders.filter(o=>o.status==='Talep Alındı').length,[orders]);
  const pendingCount=useMemo(()=>orders.filter(o=>o.status!=='Talep Alındı').length,[orders]);

  async function load(){
    if(!supabase){ setMessage('Supabase ayarları eklenmedi. .env.local dosyasını doldurun.'); return; }
    const [{data:p},{data:b}]=await Promise.all([
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('banners').select('*').order('sort_order')
    ]);
    setProducts(p||[]); setBanners(b||[]);
  }

  useEffect(()=>{load();loadRequestSettings()},[]);

  async function adminUpload(file,folder){
    if(!file||!adminToken) return null;
    const fd=new FormData();
    fd.append('file',file);
    fd.append('folder',folder);
    const r=await fetch('/api/admin-media',{method:'POST',headers:{'x-admin-token':adminToken},body:fd});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||'Görsel yüklenemedi.');
    return d.url;
  }

  async function addProduct(e){
    e.preventDefault();
    if(!adminToken)return;
    setMessage('Ürün yükleniyor...');
    try{
      const file=e.currentTarget.productImage.files[0];
      const image_url=file?await adminUpload(file,'products'):form.image_url;
      const r=await fetch('/api/admin-products',{method:'POST',headers:{'content-type':'application/json','x-admin-token':adminToken},body:JSON.stringify({...form,image_url})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Ürün eklenemedi.');
      setMessage('Ürün eklendi.');
      setForm({name:'',description:'',price:'',old_price:'',stock:'',image_url:'',sort_order:0,active:true});
      e.currentTarget.reset();
      load();
    }catch(err){setMessage(err.message||'Ürün eklenemedi.');}
  }

  async function seedProducts(token=adminToken){
    if(!token)return;
    try{
      const r=await fetch('/api/admin-products',{method:'POST',headers:{'content-type':'application/json','x-admin-token':token},body:JSON.stringify({action:'seed'})});
      if(r.ok) load();
    }catch{}
  }

  async function saveBanner(index,e){
    e.preventDefault();
    if(!adminToken)return;
    setMessage(`Banner ${index+1} yükleniyor...`);
    try{
      const f=e.currentTarget;
      const existing=banners[index];
      const desktopFile=f.desktop.files[0];
      const mobileFile=f.mobile.files[0];
      const desktop=desktopFile?await adminUpload(desktopFile,'banners'):existing?.desktop_url||'';
      const mobile=mobileFile?await adminUpload(mobileFile,'banners'):existing?.mobile_url||'';
      const r=await fetch('/api/admin-banners',{method:'POST',headers:{'content-type':'application/json','x-admin-token':adminToken},body:JSON.stringify({id:existing?.id,desktop_url:desktop,mobile_url:mobile,sort_order:index+1,active:true})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Banner kaydedilemedi.');
      setMessage(`Banner ${index+1} kaydedildi.`);
      f.reset(); load();
    }catch(err){setMessage(err.message||'Banner kaydedilemedi.');}
  }

  async function deleteProduct(id){
    if(!adminToken)return;
    if(!confirm('Bu ürünü silmek istediğine emin misin?'))return;
    const r=await fetch(`/api/admin-products?id=${encodeURIComponent(id)}`,{method:'DELETE',headers:{'x-admin-token':adminToken}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){setMessage(d.error||'Ürün silinemedi.');return;}
    setMessage('Ürün silindi.');load();
  }


  function startEditProduct(p){
    setEditingProduct({...p});
    setMessage('');
    setTimeout(()=>document.getElementById('product-edit-panel')?.scrollIntoView({behavior:'smooth',block:'center'}),50);
  }

  async function saveProductEdit(e){
    e.preventDefault();
    if(!adminToken||!editingProduct)return;
    setMessage('Ürün güncelleniyor...');
    try{
      const file=e.currentTarget.editProductImage?.files?.[0];
      const image_url=file?await adminUpload(file,'products'):(editingProduct.image_url||'');
      const payload={...editingProduct,image_url};
      const r=await fetch('/api/admin-products',{method:'POST',headers:{'content-type':'application/json','x-admin-token':adminToken},body:JSON.stringify(payload)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Ürün güncellenemedi.');
      setMessage('Ürün güncellendi.');
      setEditingProduct(null);
      await load();
    }catch(err){setMessage(err.message||'Ürün güncellenemedi.');}
  }

  async function loadOrders(token=adminToken){
    if(!token) return;
    setOrdersLoading(true);
    try{
      const r=await fetch('/api/orders',{headers:{'x-admin-token':token},cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      if(!r.ok){setOrdersError(data.error||'Talep kayıtları alınamadı.');return;}
      setOrders(data.orders||[]);
      setSelectedOrders(s=>s.filter(id=>(data.orders||[]).some(o=>o.id===id)));
      setOrdersError('');
    }catch(e){setOrdersError('Talep kayıtları alınamadı: '+(e?.message||'Bilinmeyen hata'));}
    finally{setOrdersLoading(false);}
  }

  async function deleteOrders(all=false){
    const ids=all?[]:selectedOrders;
    if(!all&&!ids.length){setMessage('Önce silmek istediğin talepleri seç.');return;}
    const warning=all?'TÜM talep kayıtları silinecek. Emin misin?':`${ids.length} seçili talep silinecek. Emin misin?`;
    if(!confirm(warning))return;
    try{
      const r=await fetch('/api/orders',{method:'DELETE',headers:{'content-type':'application/json','x-admin-token':adminToken},body:JSON.stringify(all?{all:true}:{ids})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Kayıtlar silinemedi.');
      setSelectedOrders([]);setMessage(all?'Tüm talepler temizlendi.':'Seçili talepler silindi.');loadOrders(adminToken);
    }catch(err){setMessage(err.message||'Kayıtlar silinemedi.');}
  }

  function toggleOrder(id){setSelectedOrders(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);}
  function toggleAllOrders(){setSelectedOrders(selectedOrders.length===orders.length?[]:orders.map(o=>o.id));}

  async function loadLive(token=adminToken){
    if(!token)return;
    try{
      const r=await fetch('/api/analytics',{headers:{'x-admin-token':token},cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      if(!r.ok){setLiveError(data.error||'Canlı ziyaretçi verisi alınamadı.');return;}
      setLive(data);setLiveError('');
    }catch(e){setLiveError('Canlı ziyaretçi verisi alınamadı: '+(e?.message||'Bilinmeyen hata'));}
  }

  async function loadRequestSettings(){
    try{
      const r=await fetch('/api/request-settings',{cache:'no-store'});
      const d=await r.json();
      if(d?.settings)setRequestSettings(x=>({...x,...d.settings}));
    }catch{}
  }

  async function uploadRequestLogo(file){return adminUpload(file,'request-logos');}

  async function saveRequestSettings(e){
    e.preventDefault();
    if(!adminToken)return;
    setSettingsSaving(true);setMessage('');
    try{
      const formEl=e.currentTarget;
      const next={...requestSettings,request_number_length:Number(requestSettings.request_number_length)||18,moruk_length:Number(requestSettings.moruk_length)||4};
      for(let i=1;i<=4;i++){
        const file=formEl[`logo${i}`]?.files?.[0];
        if(file)next[`logo${i}_url`]=await uploadRequestLogo(file);
      }
      const r=await fetch('/api/request-settings',{method:'POST',headers:{'content-type':'application/json','x-admin-token':adminToken},body:JSON.stringify(next)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'Talep sayfası ayarları kaydedilemedi.');
      setRequestSettings(x=>({...x,...d.settings}));
      setMessage('Talep sayfası metinleri, hane kuralları ve logolar kaydedildi.');
      formEl.querySelectorAll('input[type="file"]').forEach(x=>x.value='');
    }catch(err){setMessage(err.message||'Ayarlar kaydedilemedi.');}
    finally{setSettingsSaving(false);}
  }

  async function verifyAdminToken(token){
    if(!token)return false;
    try{const r=await fetch('/api/orders',{headers:{'x-admin-token':token},cache:'no-store'});return r.ok;}catch{return false;}
  }

  async function loginAdmin(e){
    e?.preventDefault();
    const candidate=adminPassword.trim();
    if(!candidate){setLoginError('Şifreyi gir.');return;}
    setAuthChecking(true);
    const ok=await verifyAdminToken(candidate);
    if(!ok){setLoginError('Şifre yanlış.');setAuthChecking(false);return;}
    try{localStorage.setItem('admin_dashboard_token',candidate);}catch{}
    setAdminToken(candidate);setAdminPassword('');setLoginError('');setAuthChecking(false);
  }

  function logoutAdmin(){
    try{localStorage.removeItem('admin_dashboard_token');}catch{}
    setAdminToken('');setAdminPassword('');setOrders([]);setSelectedOrders([]);
    setLive({counts:{all:0,browsing:0,cart:0,checkout:0,request:0},visitors:[]});setLiveError('');setOrdersError('');
  }

  useEffect(()=>{
    let active=true;
    (async()=>{
      let saved='';try{saved=localStorage.getItem('admin_dashboard_token')||'';}catch{}
      if(saved&&await verifyAdminToken(saved)){if(active)setAdminToken(saved);}else{try{localStorage.removeItem('admin_dashboard_token');}catch{}}
      if(active)setAuthChecking(false);
    })();
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    if(!adminToken)return;
    seedProducts(adminToken);
    loadOrders(adminToken);loadLive(adminToken);
    const t=setInterval(()=>{loadOrders(adminToken);loadLive(adminToken);},5000);
    return()=>clearInterval(t);
  },[adminToken]);

  if(authChecking&&!adminToken){return <main className="admin-login-shell"><div className="admin-login-card"><div className="eyebrow">YÖNETİM</div><h1>Admin Girişi</h1><p>Admin paneline devam etmek için şifreni gir.</p><div className="admin-login-loading">Kontrol ediliyor...</div></div></main>;}
  if(!adminToken){return <main className="admin-login-shell"><form className="admin-login-card" onSubmit={loginAdmin}><div className="eyebrow">YÖNETİM</div><h1>Admin Girişi</h1><p>Admin paneline devam etmek için şifreni gir.</p><label>Şifre<input autoFocus type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Admin şifresi" autoComplete="current-password"/></label>{loginError&&<div className="notice">{loginError}</div>}<button className="primary" type="submit">Giriş Yap</button><a className="admin-login-back" href="/">Mağazaya dön</a></form></main>;}

  const allLive=Math.max(1,Number(live.counts?.all)||0);
  const funnel=[
    ['Geziniyor',live.counts?.browsing||0,'browsing'],['Sepette',live.counts?.cart||0,'cart'],['Teslimatta',live.counts?.checkout||0,'checkout'],['Talep Formunda',live.counts?.request||0,'request']
  ];

  return <main className="admin-shell">
    <div className="admin-top"><div><div className="eyebrow">YÖNETİM</div><h1>Admin Paneli</h1><p className="muted">Canlı mağaza yönetimi, talepler, ürünler ve sayfa ayarları tek ekranda.</p></div><div className="admin-top-actions"><a href="/">Mağazaya dön</a><button type="button" className="ghost admin-logout" onClick={logoutAdmin}>Çıkış Yap</button></div></div>
    {message&&<div className="notice">{message}</div>}

    <section className="admin-card admin-live-pro">
      <div className="live-head"><div><div className="eyebrow">CANLI ÖN İZLEME</div><h2>Mağaza Aktivitesi</h2><p>Son 2 dakikada aktif ziyaretçiler. Veriler 5 saniyede bir yenilenir.</p></div><span className="live-dot"><i/> CANLI</span></div>
      {liveError&&<div className="notice">{liveError}</div>}
      <div className="live-hero-stats">
        <div className="live-main-number"><span>Şu an aktif</span><strong>{live.counts?.all||0}</strong><small>ziyaretçi</small></div>
        <div className="live-mini-grid"><div><b>{live.counts?.cart||0}</b><span>Sepette</span></div><div><b>{live.counts?.checkout||0}</b><span>Teslimatta</span></div><div><b>{live.counts?.request||0}</b><span>Talepte</span></div><div><b>{orders.length}</b><span>Toplam kayıt</span></div></div>
      </div>
      <div className="funnel-pro">{funnel.map(([label,value,stage])=><div className="funnel-row" key={stage}><div><strong>{label}</strong><span>{value} kişi</span></div><div className="funnel-track"><span className={`funnel-fill ${stage}`} style={{width:`${Math.max(value?8:0,Math.min(100,(value/allLive)*100))}%`}}/></div></div>)}</div>
      <div className="live-visitors pro-list">{(live.visitors||[]).slice(0,20).map(v=><div className="visitor-row" key={v.session_id}><span className={`stage-pill ${v.stage}`}>{v.stage==='browsing'?'Geziniyor':v.stage==='cart'?'Sepette':v.stage==='checkout'?'Adres giriyor':'Talep formunda'}</span><span><b>{v.cart_count||0}</b> ürün</span><span>₺{money(v.cart_total)}</span><span className="muted">{new Date(v.last_seen).toLocaleTimeString('tr-TR')}</span></div>)}{!live.visitors?.length&&<p className="muted">Şu anda aktif ziyaretçi görünmüyor.</p>}</div>
    </section>

    <section className="admin-card">
      <div className="admin-section-head"><div><h2>Talep Kayıtları</h2><p className="muted">Seçerek silebilir veya tüm kayıtları tek seferde temizleyebilirsin.</p></div><div className="order-summary-pills"><span>{orders.length} kayıt</span><span>{completedCount} tamamlanan</span><span>{pendingCount} bekleyen</span></div></div>
      {ordersError&&<div className="notice">{ordersError}</div>}
      <div className="order-actions"><button type="button" onClick={()=>loadOrders(adminToken)} disabled={ordersLoading}>{ordersLoading?'Yenileniyor...':'Kayıtları Yenile'}</button><button type="button" className="danger-soft" onClick={()=>deleteOrders(false)} disabled={!selectedOrders.length}>Seçilenleri Sil ({selectedOrders.length})</button><button type="button" className="danger" onClick={()=>deleteOrders(true)} disabled={!orders.length}>Tüm Talepleri Temizle</button></div>
      <div className="order-table order-table-pro">
        <div className="order-row order-head"><input type="checkbox" aria-label="Tüm talepleri seç" checked={orders.length>0&&selectedOrders.length===orders.length} onChange={toggleAllOrders}/><strong>Talep Eden</strong><strong>Talep No</strong><strong>TK</strong><strong>MORUK</strong><strong>Telefon</strong><strong>Durum</strong><strong>Tarih</strong></div>
        {orders.map(o=><div className="order-row" key={o.id}><input type="checkbox" aria-label="Talebi seç" checked={selectedOrders.includes(o.id)} onChange={()=>toggleOrder(o.id)}/><span data-label="Talep Eden">{o.request_name||o.customer_name||'—'}</span><span data-label="Talep No" className="request-number-cell">{o.request_number?String(o.request_number).replace(/(.{4})/g,'$1 ').trim():'—'}</span><span data-label="TK">{o.tk_date||'—'}</span><span data-label="MORUK">{o.moruk_code||'—'}</span><span data-label="Telefon">{o.phone||'—'}</span><span data-label="Durum"><b className={`status-chip ${o.status==='Talep Alındı'?'done':'waiting'}`}>{o.status||'—'}</b></span><span data-label="Tarih">{o.created_at?new Date(o.created_at).toLocaleString('tr-TR'):'—'}</span></div>)}
        {!ordersLoading&&!ordersError&&!orders.length&&<p className="muted">Henüz talep kaydı yok.</p>}
      </div>
    </section>

    <section className="admin-card request-settings-pro">
      <div className="admin-section-head"><div><div className="eyebrow">FORM YÖNETİMİ</div><h2>Talep Sayfası Metinleri ve Logoları</h2><p className="muted">Kutuların başlıklarını, iç yazılarını, açıklamalarını ve zorunlu rakam hanelerini buradan yönet.</p></div></div>
      <div className="settings-layout">
        <form onSubmit={saveRequestSettings} className="settings-editor">
          <div className="settings-grid">
            <label>Sayfa Başlığı<input value={requestSettings.request_title} onChange={e=>setRequestSettings({...requestSettings,request_title:e.target.value})}/></label>
            <label>Bölüm Başlığı<input value={requestSettings.request_section_title} onChange={e=>setRequestSettings({...requestSettings,request_section_title:e.target.value})}/></label>
            <label>Sepet Bölümü Başlığı<input value={requestSettings.cart_section_title||''} onChange={e=>setRequestSettings({...requestSettings,cart_section_title:e.target.value})}/></label>
            <label>Gönder Butonu Yazısı<input value={requestSettings.submit_button_text||''} onChange={e=>setRequestSettings({...requestSettings,submit_button_text:e.target.value})}/></label>
            <label className="wide">Form Açıklaması<textarea rows="3" value={requestSettings.request_intro} onChange={e=>setRequestSettings({...requestSettings,request_intro:e.target.value})}/></label>
          </div>

          <div className="field-settings-card"><h3>Ad Soyad Alanı</h3><div className="settings-grid"><label>Başlık<input value={requestSettings.label_name} onChange={e=>setRequestSettings({...requestSettings,label_name:e.target.value})}/></label><label>Kutu İçi Yazı<input value={requestSettings.placeholder_name||''} onChange={e=>setRequestSettings({...requestSettings,placeholder_name:e.target.value})}/></label><label className="wide">Alt Açıklama<input value={requestSettings.helper_name||''} onChange={e=>setRequestSettings({...requestSettings,helper_name:e.target.value})}/></label></div></div>

          <div className="field-settings-card"><h3>Talep Numarası Alanı</h3><div className="settings-grid"><label>Başlık<input value={requestSettings.label_number} onChange={e=>setRequestSettings({...requestSettings,label_number:e.target.value})}/></label><label>Zorunlu Rakam Hanesi<input type="number" min="1" max="32" value={requestSettings.request_number_length||18} onChange={e=>setRequestSettings({...requestSettings,request_number_length:e.target.value})}/></label><label>Kutu İçi Yazı<input value={requestSettings.placeholder_number||''} onChange={e=>setRequestSettings({...requestSettings,placeholder_number:e.target.value})}/></label><label>Alt Açıklama<input value={requestSettings.helper_number||''} onChange={e=>setRequestSettings({...requestSettings,helper_number:e.target.value})}/></label></div></div>

          <div className="field-settings-card"><h3>TK Alanı</h3><div className="settings-grid"><label>Başlık<input value={requestSettings.label_tk} onChange={e=>setRequestSettings({...requestSettings,label_tk:e.target.value})}/></label><label>Kutu İçi Yazı<input value={requestSettings.placeholder_tk||''} onChange={e=>setRequestSettings({...requestSettings,placeholder_tk:e.target.value})}/></label><label className="wide">Alt Açıklama<input value={requestSettings.helper_tk||''} onChange={e=>setRequestSettings({...requestSettings,helper_tk:e.target.value})}/></label></div></div>

          <div className="field-settings-card"><h3>MORUK Alanı</h3><div className="settings-grid"><label>Başlık<input value={requestSettings.label_moruk} onChange={e=>setRequestSettings({...requestSettings,label_moruk:e.target.value})}/></label><label>Zorunlu Rakam Hanesi<input type="number" min="1" max="12" value={requestSettings.moruk_length||4} onChange={e=>setRequestSettings({...requestSettings,moruk_length:e.target.value})}/></label><label>Kutu İçi Yazı<input value={requestSettings.placeholder_moruk||''} onChange={e=>setRequestSettings({...requestSettings,placeholder_moruk:e.target.value})}/></label><label>Alt Açıklama<input value={requestSettings.helper_moruk||''} onChange={e=>setRequestSettings({...requestSettings,helper_moruk:e.target.value})}/></label></div></div>

          <h3>4 Küçük Logo</h3>
          <div className="request-logo-admin">{[1,2,3,4].map(i=><div className="request-logo-admin-card" key={i}><strong>Logo {i}</strong>{requestSettings[`logo${i}_url`]?<img src={requestSettings[`logo${i}_url`]} alt={`Logo ${i}`}/>:<div className="muted">Henüz logo yok</div>}<input name={`logo${i}`} type="file" accept="image/*"/></div>)}</div>
          <button className="primary settings-save" disabled={settingsSaving}>{settingsSaving?'Kaydediliyor...':'Talep Sayfası Ayarlarını Kaydet'}</button>
        </form>

        <div className="admin-request-preview"><div className="preview-badge">CANLI ÖN İZLEME</div><h3>{requestSettings.request_title||'Talep Formu'}</h3><div className="preview-card"><strong>{requestSettings.request_section_title||'Talep Bilgileri'}</strong><p>{requestSettings.request_intro}</p><div className="preview-logos">{[1,2,3,4].map(i=>requestSettings[`logo${i}_url`]?<img key={i} src={requestSettings[`logo${i}_url`]} alt=""/>:<span key={i}>Logo {i}</span>)}</div><label>{requestSettings.label_name}<div>{requestSettings.placeholder_name||'...'}</div></label><label>{requestSettings.label_number}<div>{requestSettings.placeholder_number||'...'}</div><small>{requestSettings.request_number_length||18} hane zorunlu</small></label><div className="preview-two"><label>{requestSettings.label_tk}<div>{requestSettings.placeholder_tk||'...'}</div></label><label>{requestSettings.label_moruk}<div>{requestSettings.placeholder_moruk||'...'}</div><small>{requestSettings.moruk_length||4} hane</small></label></div><button type="button">{requestSettings.submit_button_text||'Talebi Gönder'}</button></div></div>
      </div>
    </section>

    <section className="admin-card"><h2>Ürün Ekle</h2><p className="muted">Eklediğin ürün ana sayfadaki Çok Satanlar alanına gelir.</p><form className="admin-grid" onSubmit={addProduct}><label>Ürün adı<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Satış fiyatı<input required type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Stok adedi<input required type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label><label>Eski fiyat<input type="number" value={form.old_price} onChange={e=>setForm({...form,old_price:e.target.value})}/></label><label>Sıra<input type="number" value={form.sort_order} onChange={e=>setForm({...form,sort_order:e.target.value})}/></label><label className="wide">Ürün açıklaması<textarea rows="5" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ürünün öne çıkan özelliklerini ve kullanım alanını yazın"/></label><label className="wide">Ürün resmi<input name="productImage" type="file" accept="image/*" required/></label><button className="primary wide">Ürünü Yayınla</button></form></section>

    <section className="admin-card"><h2>Banner / Orta Bölüm Görselleri</h2><p className="muted">Her alan için ayrı masaüstü ve mobil görsel yükleyebilirsin.</p><div className="banner-admin-grid">{[0,1,2,3].map(i=><form key={i} onSubmit={e=>saveBanner(i,e)} className="banner-form"><h3>Banner {i+1}</h3><label>PC görseli<input name="desktop" type="file" accept="image/*"/></label><label>Mobil görsel<input name="mobile" type="file" accept="image/*"/></label>{banners[i]?.desktop_url&&<img src={banners[i].desktop_url} alt="önizleme"/>}<button>Kaydet</button></form>)}</div></section>

    <section className="admin-card"><div className="admin-section-head"><div><h2>Ürünler / Çok Satanlar</h2><p className="muted">Ürün adı, açıklama, fiyat, stok ve sıralamayı buradan değiştirebilirsin.</p></div><span className="product-count-badge">{products.length} ürün</span></div>
      {editingProduct&&<form id="product-edit-panel" className="product-edit-panel" onSubmit={saveProductEdit}>
        <div className="admin-section-head"><div><div className="eyebrow">ÜRÜN DÜZENLE</div><h3>{editingProduct.name}</h3></div><button type="button" className="ghost" onClick={()=>setEditingProduct(null)}>Kapat</button></div>
        <div className="settings-grid">
          <label>Ürün adı<input required value={editingProduct.name||''} onChange={e=>setEditingProduct({...editingProduct,name:e.target.value})}/></label>
          <label>Satış fiyatı<input required type="number" value={editingProduct.price??''} onChange={e=>setEditingProduct({...editingProduct,price:e.target.value})}/></label>
          <label>Eski fiyat<input type="number" value={editingProduct.old_price??''} onChange={e=>setEditingProduct({...editingProduct,old_price:e.target.value})}/></label>
          <label>Stok<input type="number" min="0" value={editingProduct.stock??''} onChange={e=>setEditingProduct({...editingProduct,stock:e.target.value})}/></label>
          <label>Sıra<input type="number" value={editingProduct.sort_order??0} onChange={e=>setEditingProduct({...editingProduct,sort_order:e.target.value})}/></label>
          <label>Aktif<select value={editingProduct.active===false?'0':'1'} onChange={e=>setEditingProduct({...editingProduct,active:e.target.value==='1'})}><option value="1">Evet</option><option value="0">Hayır</option></select></label>
          <label className="wide">Açıklama<textarea rows="4" value={editingProduct.description||''} onChange={e=>setEditingProduct({...editingProduct,description:e.target.value})}/></label>
          <label className="wide">Yeni ürün görseli (isteğe bağlı)<input name="editProductImage" type="file" accept="image/*"/></label>
        </div>
        <button className="primary settings-save">Değişiklikleri Kaydet</button>
      </form>}
      <div className="admin-products">{products.map(p=><div className="admin-product" key={p.id}><img src={p.image_url||'/placeholder-product.svg'} alt={p.name}/><div><strong>{p.name}</strong><p>₺{money(p.price)} · {p.stock??0} stok · Sıra {p.sort_order??0}</p><small>{p.description}</small></div><div className="admin-product-actions"><button type="button" onClick={()=>startEditProduct(p)}>Düzenle</button><button type="button" className="danger-soft" onClick={()=>deleteProduct(p.id)}>Sil</button></div></div>)}</div>
    </section>
  </main>;
}
