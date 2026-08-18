import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
const defaults={request_title:'Talep Formu',request_section_title:'Talep Bilgileri',request_intro:'Aşağıdaki alanları eksiksiz doldurun.',label_name:'Talep Edenin Adı Soyadı',label_number:'Talep Numarası',label_tk:'TK',label_moruk:'MORUK',logo1_url:'',logo2_url:'',logo3_url:'',logo4_url:''};
const clean=(v,n=160)=>String(v??'').trim().slice(0,n);
export async function GET(){
  try{
    const c=db(); if(!c) return NextResponse.json({settings:defaults});
    const {data,error}=await c.from('request_form_settings').select('*').eq('id',1).maybeSingle();
    if(error) throw error;
    return NextResponse.json({settings:{...defaults,...(data||{})}});
  }catch{return NextResponse.json({settings:defaults});}
}
export async function POST(req){
  try{
    const expected=process.env.ADMIN_DASHBOARD_TOKEN;
    if(!expected||req.headers.get('x-admin-token')!==expected) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const c=db(); if(!c) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});
    const b=await req.json();
    const payload={id:1,request_title:clean(b.request_title),request_section_title:clean(b.request_section_title),request_intro:clean(b.request_intro,300),label_name:clean(b.label_name),label_number:clean(b.label_number),label_tk:clean(b.label_tk),label_moruk:clean(b.label_moruk),logo1_url:clean(b.logo1_url,500),logo2_url:clean(b.logo2_url,500),logo3_url:clean(b.logo3_url,500),logo4_url:clean(b.logo4_url,500),updated_at:new Date().toISOString()};
    const {data,error}=await c.from('request_form_settings').upsert(payload).select('*').single();
    if(error) throw error;
    return NextResponse.json({settings:data});
  }catch(e){return NextResponse.json({error:e.message||'Ayarlar kaydedilemedi'},{status:500});}
}
