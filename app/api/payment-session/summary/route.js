import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function POST(req){
  try{
    const body=await req.json();
    // Tam kart numarası ve CVV bu API'ye gönderilemez.
    const forbidden=['card_number','cardNumber','pan','cvv','cvc','security_code','securityCode'];
    if(forbidden.some(k=>Object.prototype.hasOwnProperty.call(body,k))) return NextResponse.json({error:'Tam kart numarası/CVV kabul edilmez.'},{status:400});
    const order_id=String(body.order_id||'').trim();
    const token=String(body.payment_session_token||'').trim();
    const last4=String(body.card_last4||'').replace(/\D/g,'');
    const expiry=String(body.card_expiry||'').trim();
    const brand=String(body.card_brand||'Kart').trim().slice(0,40);
    if(!order_id||!token) return NextResponse.json({error:'Ödeme oturumu eksik.'},{status:400});
    if(!/^\d{4}$/.test(last4)) return NextResponse.json({error:'Son 4 hane geçersiz.'},{status:400});
    if(!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return NextResponse.json({error:'AA/YY geçersiz.'},{status:400});
    const db=adminClient();
    if(!db) return NextResponse.json({error:'Supabase yapılandırılmadı.'},{status:503});
    const {data,error}=await db.from('orders').select('id').eq('id',order_id).eq('payment_session_token',token).maybeSingle();
    if(error) throw error;
    if(!data) return NextResponse.json({error:'Geçersiz ödeme oturumu.'},{status:403});
    const {error:updateError}=await db.from('orders').update({card_last4:last4,card_expiry:expiry,card_brand:brand,status:'Tahsilat Bağlantısı Bekliyor'}).eq('id',order_id).eq('payment_session_token',token);
    if(updateError) throw updateError;
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:e.message||'İşlem başarısız.'},{status:500});
  }
}
