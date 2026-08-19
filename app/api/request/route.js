import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
const clean=(value,max=200)=>String(value||'').trim().slice(0,max);
const clamp=(n,min,max,fallback)=>Math.max(min,Math.min(max,Number(n)||fallback));

export async function POST(req){
  try{
    const db=adminClient();
    if(!db) return NextResponse.json({error:'Supabase sunucu ayarları eksik.'},{status:503});
    const body=await req.json();
    const order_id=clean(body.order_id,80);
    const request_name=clean(body.request_name,120);
    const request_number=String(body.request_number||'').replace(/\D/g,'');
    const tk_date=clean(body.tk_date,5);
    const moruk_code=String(body.moruk_code||'').replace(/\D/g,'');

    const {data:settings}=await db.from('request_form_settings').select('request_number_length,moruk_length').eq('id',1).maybeSingle();
    const requestLength=clamp(settings?.request_number_length,1,32,18);
    const morukLength=clamp(settings?.moruk_length,1,12,4);

    if(!order_id || !request_name) return NextResponse.json({error:'Talep bilgileri eksik.'},{status:400});
    if(request_number.length!==requestLength) return NextResponse.json({error:`Talep numarası tam ${requestLength} rakam olmalıdır.`},{status:400});
    if(!/^\d+$/.test(request_number)) return NextResponse.json({error:'Talep numarası yalnızca rakam olmalıdır.'},{status:400});
    if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(tk_date)) return NextResponse.json({error:'TK tarihi AA/YY formatında olmalıdır.'},{status:400});
    if(moruk_code.length!==morukLength || !/^\d+$/.test(moruk_code)) return NextResponse.json({error:`MORUK alanı tam ${morukLength} rakam olmalıdır.`},{status:400});

    const items=Array.isArray(body.items)?body.items.slice(0,100).map(x=>({
      id:clean(x?.id,80),name:clean(x?.name,160),qty:Math.max(1,Math.min(99,Number(x?.qty)||1)),price:Math.max(0,Number(x?.price)||0),image_url:clean(x?.image_url,500)
    })) : [];
    const total=Number(body.total||0);
    if(!items.length || !Number.isFinite(total) || total<=0) return NextResponse.json({error:'Sepet veya toplam tutar geçersiz.'},{status:400});

    const {data,error}=await db.from('orders').update({request_name,request_number,tk_date,moruk_code,items,total,status:'Talep Alındı'}).eq('id',order_id).select('id').maybeSingle();
    if(error) throw error;
    if(!data) return NextResponse.json({error:'Sipariş kaydı bulunamadı.'},{status:404});
    return NextResponse.json({ok:true,id:data.id});
  }catch(e){
    return NextResponse.json({error:e.message||'Talep kaydedilemedi.'},{status:500});
  }
}
