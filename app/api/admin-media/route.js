import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}

export async function POST(req){
  try{
    const expected=process.env.ADMIN_DASHBOARD_TOKEN;
    if(!expected||req.headers.get('x-admin-token')!==expected) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const c=db(); if(!c) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});
    const fd=await req.formData();
    const file=fd.get('file');
    const requestedFolder=String(fd.get('folder')||'request-logos');
    const allowed=['request-logos','banners','products'];
    const folder=allowed.includes(requestedFolder)?requestedFolder:'request-logos';
    if(!file||typeof file==='string') return NextResponse.json({error:'Dosya seçilmedi'},{status:400});
    if(!String(file.type||'').startsWith('image/')) return NextResponse.json({error:'Sadece görsel yüklenebilir'},{status:400});
    if(Number(file.size||0)>8*1024*1024) return NextResponse.json({error:'Görsel en fazla 8 MB olabilir'},{status:400});
    const ext=(String(file.name||'image').split('.').pop()||'png').replace(/[^a-z0-9]/gi,'').slice(0,8)||'png';
    const path=`${folder}/${crypto.randomUUID()}.${ext}`;
    const buf=Buffer.from(await file.arrayBuffer());
    const {error}=await c.storage.from('site-media').upload(path,buf,{contentType:file.type||'image/png',upsert:false});
    if(error) throw error;
    const {data}=c.storage.from('site-media').getPublicUrl(path);
    return NextResponse.json({url:data.publicUrl,path});
  }catch(e){return NextResponse.json({error:e.message||'Görsel yüklenemedi'},{status:500});}
}
