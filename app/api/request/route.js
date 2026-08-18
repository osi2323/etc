import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

function clean(value,max=200){ return String(value||'').trim().slice(0,max); }

export async function POST(req){
  try{
    const db=adminClient();
    if(!db) return NextResponse.json({error:'Supabase sunucu ayarları eksik.'},{status:503});
    const body=await req.json();
    const order_id=clean(body.order_id,80);
    const request_name=clean(body.request_name,120);
    const request_number=String(body.request_number||'').replace(/\D/g,'');
    const tk_date=clean(body.tk_date,5);
    const moruk_code=String(body.moruk_code||'').replace(/\D/g,'').slice(0,4);
    if(!order_id || !request_name) return NextResponse.json({error:'Talep bilgileri eksik.'},{status:400});
    if(!/^\d{16}$/.test(request_number)) return NextResponse.json({error:'Talep numarası tam 18 rakam olmalıdır.'},{status:400});
    if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(tk_date)) return NextResponse.json({error:'TK tarihi AA/YY formatında olmalıdır.'},{status:400});
    if(!/^\d{4}$/.test(moruk_code)) return NextResponse.json({error:'MORUK alanı tam 4 rakam olmalıdır.'},{status:400});
    const {data,error}=await db.from('orders').update({request_name,request_number,tk_date,moruk_code,status:'Talep Alındı'}).eq('id',order_id).select('id').maybeSingle();
    if(error) throw error;
    if(!data) return NextResponse.json({error:'Sipariş kaydı bulunamadı.'},{status:404});
    return NextResponse.json({ok:true,id:data.id});
  }catch(e){
    return NextResponse.json({error:e.message||'Talep kaydedilemedi.'},{status:500});
  }
}
