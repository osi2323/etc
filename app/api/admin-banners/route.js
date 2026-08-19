import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;}
function authorized(req){const expected=process.env.ADMIN_DASHBOARD_TOKEN;return !!expected&&req.headers.get('x-admin-token')===expected;}
const clean=(v,n=500)=>String(v??'').trim().slice(0,n);
export async function POST(req){
  try{
    if(!authorized(req)) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const c=db(); if(!c) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});
    const b=await req.json();
    const payload={desktop_url:clean(b.desktop_url),mobile_url:clean(b.mobile_url),sort_order:Number(b.sort_order)||0,active:b.active!==false};
    let data,error;
    if(b.id){({data,error}=await c.from('banners').update(payload).eq('id',b.id).select('*').single());}
    else{({data,error}=await c.from('banners').insert(payload).select('*').single());}
    if(error) throw error;
    return NextResponse.json({banner:data});
  }catch(e){return NextResponse.json({error:e.message||'Banner kaydedilemedi.'},{status:500});}
}
