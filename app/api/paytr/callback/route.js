import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function POST(req){
  try{
    const merchant_key=process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt=process.env.PAYTR_MERCHANT_SALT;
    const db=adminClient();
    if(!merchant_key||!merchant_salt||!db) return new Response('PAYTR notification failed: config',{status:500});
    const form=await req.formData();
    const merchant_oid=String(form.get('merchant_oid')||'');
    const status=String(form.get('status')||'');
    const total_amount=String(form.get('total_amount')||'');
    const incoming=String(form.get('hash')||'');
    const expected=crypto.createHmac('sha256',merchant_key).update(`${merchant_oid}${merchant_salt}${status}${total_amount}`).digest('base64');
    if(incoming!==expected) return new Response('PAYTR notification failed: bad hash',{status:400});
    const {data:order}=await db.from('orders').select('id,status').eq('merchant_oid',merchant_oid).single();
    if(!order) return new Response('OK',{headers:{'content-type':'text/plain'}});
    if(order.status==='Ödeme Başarılı'||order.status==='Ödeme Başarısız') return new Response('OK',{headers:{'content-type':'text/plain'}});
    const nextStatus=status==='success'?'Ödeme Başarılı':'Ödeme Başarısız';
    await db.from('orders').update({status:nextStatus}).eq('id',order.id);
    return new Response('OK',{headers:{'content-type':'text/plain'}});
  }catch{
    return new Response('PAYTR notification failed',{status:500});
  }
}
