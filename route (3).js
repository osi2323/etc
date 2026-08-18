import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

function cleanLast4(value){
  const v=String(value||'').replace(/\D/g,'');
  return /^\d{4}$/.test(v) ? v : null;
}

function cleanExpiry(value){
  const v=String(value||'').trim();
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(v) ? v : null;
}

export async function POST(req){
  try{
    const expected=process.env.PAYMENT_SUMMARY_SECRET;
    const supplied=req.headers.get('x-payment-summary-secret');
    if(!expected || supplied!==expected) return NextResponse.json({error:'Yetkisiz'},{status:401});

    const body=await req.json();
    // Güvenlik: tam PAN/CVV benzeri alanları bu endpoint asla kabul etmez.
    const forbidden=['card_number','cardNumber','pan','cvv','cvc','security_code','securityCode'];
    if(forbidden.some(k=>Object.prototype.hasOwnProperty.call(body,k))){
      return NextResponse.json({error:'Tam kart numarası/CVV kabul edilmez.'},{status:400});
    }

    const orderId=String(body.order_id||'').trim();
    if(!orderId) return NextResponse.json({error:'order_id gerekli'},{status:400});

    const card_last4=cleanLast4(body.card_last4);
    const card_expiry=cleanExpiry(body.card_expiry);
    const card_brand=String(body.card_brand||'').trim().slice(0,40) || null;
    const status=String(body.status||'').trim().slice(0,60) || null;

    if(body.card_last4 && !card_last4) return NextResponse.json({error:'card_last4 yalnızca 4 rakam olmalı'},{status:400});
    if(body.card_expiry && !card_expiry) return NextResponse.json({error:'card_expiry AA/YY biçiminde olmalı'},{status:400});

    const db=adminClient();
    if(!db) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});

    const update={card_brand,card_last4,card_expiry};
    if(status) update.status=status;
    const {error}=await db.from('orders').update(update).eq('id',orderId);
    if(error) throw error;
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e.message||'Güncelleme başarısız'},{status:500});
  }
}
