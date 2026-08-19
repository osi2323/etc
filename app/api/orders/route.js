import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
function cleanText(value,max=300){ return String(value||'').trim().slice(0,max); }
function authorized(req){const expected=process.env.ADMIN_DASHBOARD_TOKEN;return !!expected&&req.headers.get('x-admin-token')===expected;}

export async function POST(req){
  try{
    const db=adminClient();
    if(!db) return NextResponse.json({error:'Supabase sunucu ayarları eksik.'},{status:503});
    const body=await req.json();
    const customer_name=cleanText(body.customer_name,120);
    const phone=cleanText(body.phone,30);
    const city=cleanText(body.city,80);
    const district=cleanText(body.district,80);
    const address=cleanText(body.address,500);
    const total=Number(body.total||0);
    const items=Array.isArray(body.items)?body.items.slice(0,100).map(x=>({
      id:cleanText(x?.id,80),name:cleanText(x?.name,160),qty:Math.max(1,Math.min(99,Number(x?.qty)||1)),price:Math.max(0,Number(x?.price)||0),image_url:cleanText(x?.image_url,500)
    })):[];
    if(!customer_name||!phone||!city||!district||!address) return NextResponse.json({error:'Teslimat bilgilerini eksiksiz doldurun.'},{status:400});
    if(!items.length||!Number.isFinite(total)||total<=0) return NextResponse.json({error:'Sepet veya toplam tutar geçersiz.'},{status:400});
    const {data,error}=await db.from('orders').insert({customer_name,phone,city,district,address,total,status:'Talep Formu Bekleniyor',items}).select('id').single();
    if(error) throw error;
    return NextResponse.json({id:data.id});
  }catch(e){ return NextResponse.json({error:e.message||'Sipariş oluşturulamadı.'},{status:500}); }
}

export async function GET(req){
  try{
    if(!authorized(req)) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const db=adminClient(); if(!db) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});
    const {data,error}=await db.from('orders').select('*').order('created_at',{ascending:false}).limit(250);
    if(error) throw error;
    return NextResponse.json({orders:data||[]});
  }catch(e){ return NextResponse.json({error:e.message},{status:500}); }
}

export async function DELETE(req){
  try{
    if(!authorized(req)) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const db=adminClient(); if(!db) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});
    const body=await req.json().catch(()=>({}));
    if(body.all===true){
      const {error}=await db.from('orders').delete().not('id','is',null);
      if(error) throw error;
      return NextResponse.json({ok:true,all:true});
    }
    const ids=Array.isArray(body.ids)?body.ids.filter(Boolean).slice(0,250):[];
    if(!ids.length) return NextResponse.json({error:'Silinecek kayıt seçilmedi.'},{status:400});
    const {error}=await db.from('orders').delete().in('id',ids);
    if(error) throw error;
    return NextResponse.json({ok:true,count:ids.length});
  }catch(e){return NextResponse.json({error:e.message||'Kayıtlar silinemedi.'},{status:500});}
}
