import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}

const defaults={
  request_title:'Talep Formu',request_section_title:'Talep Bilgileri',request_intro:'Aşağıdaki alanları eksiksiz doldurun.',cart_section_title:'Seçtiğiniz Ürünler',
  label_name:'Talep Edenin Adı Soyadı',placeholder_name:'AD SOYAD',helper_name:'',
  label_number:'Talep Numarası',placeholder_number:'1234 5678 9012 3456 78',helper_number:'Yalnızca rakam giriniz.',request_number_length:18,
  label_tk:'TK',placeholder_tk:'AA/YY',helper_tk:'AA/YY formatında giriniz.',
  label_moruk:'MORUK',placeholder_moruk:'0000',helper_moruk:'Yalnızca rakam giriniz.',moruk_length:4,
  submit_button_text:'Talebi Gönder',
  success_icon:'✅',success_title:'Talebiniz alındı',success_message:'Talep bilgileriniz başarıyla kaydedildi.',success_button_text:'Mağazaya Dön',
  campaign_title:'HAFTANIN KAMPANYALARI',campaign_message_1:'Seçili ürünlerde fırsatları kaçırma',campaign_message_2:'Çok satan ürünlerde özel fiyatlar',campaign_message_3:'Stoklarla sınırlı avantajlar',
  logo1_url:'',logo2_url:'',logo3_url:'',logo4_url:''
};
const clean=(v,n=160)=>String(v??'').trim().slice(0,n);
const num=(v,min,max,fallback)=>Math.max(min,Math.min(max,Number(v)||fallback));

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
    const payload={
      id:1,
      request_title:clean(b.request_title),request_section_title:clean(b.request_section_title),request_intro:clean(b.request_intro,400),cart_section_title:clean(b.cart_section_title),
      label_name:clean(b.label_name),placeholder_name:clean(b.placeholder_name),helper_name:clean(b.helper_name,240),
      label_number:clean(b.label_number),placeholder_number:clean(b.placeholder_number),helper_number:clean(b.helper_number,240),request_number_length:num(b.request_number_length,1,32,18),
      label_tk:clean(b.label_tk),placeholder_tk:clean(b.placeholder_tk),helper_tk:clean(b.helper_tk,240),
      label_moruk:clean(b.label_moruk),placeholder_moruk:clean(b.placeholder_moruk),helper_moruk:clean(b.helper_moruk,240),moruk_length:num(b.moruk_length,1,12,4),
      submit_button_text:clean(b.submit_button_text),
      success_icon:clean(b.success_icon,16),success_title:clean(b.success_title),success_message:clean(b.success_message,500),success_button_text:clean(b.success_button_text),
      campaign_title:clean(b.campaign_title),campaign_message_1:clean(b.campaign_message_1,240),campaign_message_2:clean(b.campaign_message_2,240),campaign_message_3:clean(b.campaign_message_3,240),
      logo1_url:clean(b.logo1_url,500),logo2_url:clean(b.logo2_url,500),logo3_url:clean(b.logo3_url,500),logo4_url:clean(b.logo4_url,500),updated_at:new Date().toISOString()
    };
    const {data,error}=await c.from('request_form_settings').upsert(payload).select('*').single();
    if(error) throw error;
    return NextResponse.json({settings:data});
  }catch(e){return NextResponse.json({error:e.message||'Ayarlar kaydedilemedi'},{status:500});}
}
