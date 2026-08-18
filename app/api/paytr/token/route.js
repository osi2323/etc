import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

function getIp(req){
  const f=req.headers.get('x-forwarded-for');
  return (f?f.split(',')[0].trim():req.headers.get('x-real-ip'))||'127.0.0.1';
}

export async function POST(req){
  try{
    const merchant_id=process.env.PAYTR_MERCHANT_ID;
    const merchant_key=process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt=process.env.PAYTR_MERCHANT_SALT;
    if(!merchant_id||!merchant_key||!merchant_salt) return NextResponse.json({error:'PayTR mağaza bilgileri Vercel Environment Variables bölümüne eklenmemiş.'},{status:503});
    const db=adminClient();
    if(!db) return NextResponse.json({error:'Supabase sunucu ayarları eksik.'},{status:503});
    const {order_id}=await req.json();
    if(!order_id) return NextResponse.json({error:'Sipariş bulunamadı.'},{status:400});
    const {data:order,error}=await db.from('orders').select('id,customer_name,email,phone,address,city,district,total,items,status').eq('id',order_id).single();
    if(error||!order) return NextResponse.json({error:'Sipariş bulunamadı.'},{status:404});
    const merchant_oid=String(order.id).replaceAll('-','');
    const user_ip=getIp(req).slice(0,39);
    const email=String(order.email||'').trim();
    if(!email) return NextResponse.json({error:'Ödeme için e-posta adresi gerekli.'},{status:400});
    const payment_amount=Math.round(Number(order.total||0)*100);
    if(payment_amount<=0) return NextResponse.json({error:'Geçersiz sipariş tutarı.'},{status:400});
    const basket=(Array.isArray(order.items)?order.items:[]).map(x=>[String(x.name||'Ürün').slice(0,100),Number(x.price||0).toFixed(2),Math.max(1,Number(x.qty)||1)]);
    const user_basket=Buffer.from(JSON.stringify(basket)).toString('base64');
    const no_installment='0',max_installment='0',currency='TL',test_mode=process.env.PAYTR_TEST_MODE==='0'?'0':'1';
    const hashStr=`${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytr_token=crypto.createHmac('sha256',merchant_key).update(hashStr+merchant_salt).digest('base64');
    const origin=req.nextUrl.origin;
    const form=new URLSearchParams({
      merchant_id,user_ip,merchant_oid,email,payment_amount:String(payment_amount),paytr_token,user_basket,
      debug_on:process.env.PAYTR_DEBUG_ON==='0'?'0':'1',no_installment,max_installment,
      user_name:String(order.customer_name||'').slice(0,60),
      user_address:`${order.address||''} ${order.district||''} ${order.city||''}`.trim().slice(0,400),
      user_phone:String(order.phone||'').slice(0,20),
      merchant_ok_url:`${origin}/?payment=success&order=${order.id}`,
      merchant_fail_url:`${origin}/?payment=fail&order=${order.id}`,
      timeout_limit:'30',currency,test_mode,lang:'tr'
    });
    const r=await fetch('https://www.paytr.com/odeme/api/get-token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form.toString(),cache:'no-store'});
    const result=await r.json();
    if(result.status!=='success') return NextResponse.json({error:result.reason||'PayTR ödeme formu başlatılamadı.'},{status:502});
    await db.from('orders').update({merchant_oid}).eq('id',order.id);
    return NextResponse.json({token:result.token});
  }catch(e){
    return NextResponse.json({error:e.message||'Ödeme formu başlatılamadı.'},{status:500});
  }
}
