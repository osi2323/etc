import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
const clean=(v,n=300)=>String(v??'').trim().slice(0,n);
const DEMO_PRODUCTS=[
{id:'10000000-0000-0000-0000-000000000001',name:'Karaca Swiss Crystal Neocast 7 Parça Döküm Tencere ve Tava Seti - Pembe',price:3199,old_price:6815,stock:99,description:'7 parçalık döküm tencere ve tava seti. Modern pembe gövdesi ve farklı parça seçenekleriyle günlük pişirme ihtiyaçlarına uygundur.',image_url:'/products/swiss-crystal-pink.png',sort_order:1,active:true},
{id:'10000000-0000-0000-0000-000000000002',name:'Emsan Forever Bone Lord 53 Parça 12 Kişilik Yemek Takımı',price:2800,old_price:6800,stock:78,description:'12 kişilik 53 parçalık yemek takımı. Krem tonları ve zarif detaylarıyla günlük ve özel sofralar için hazırlanmıştır.',image_url:'/products/emsan-forever-bone.png',sort_order:2,active:true},
{id:'10000000-0000-0000-0000-000000000003',name:'Karaca Home Ellie Yeşil Çift Kişilik Pike',price:90,old_price:189,stock:77,description:'Yeşil tonlarda, dokulu ve ferah görünümlü çift kişilik pike.',image_url:'/products/ellie-green-pike.png',sort_order:3,active:true},
{id:'10000000-0000-0000-0000-000000000004',name:'Karaca Home Maye %100 Pamuk Fırfırlı Çift Kişilik Pike - Mürdüm',price:130,old_price:225,stock:99,description:'%100 pamuk dokusu ve fırfırlı kenarlarıyla dekoratif çift kişilik pike.',image_url:'/products/maye-purple-pike.png',sort_order:4,active:true},
{id:'10000000-0000-0000-0000-000000000005',name:'Homend Fanomen 9011H Uzaktan Kumandalı Soğuk Su ve Buz Hazneli Kule Tipi Vantilatör 60W',price:2499,old_price:5328,stock:88,description:'Uzaktan kumandalı, su ve buz hazneli 60W kule tipi vantilatör.',image_url:'/products/homend-fanomen.png',sort_order:5,active:true},
{id:'10000000-0000-0000-0000-000000000006',name:'Karaca Plasma Steel 316+ 3Ply 7 Parça Tencere ve Tava Seti',price:2990,old_price:5999,stock:100,description:'Paslanmaz çelik görünümlü 7 parçalık tencere ve tava seti.',image_url:'/products/plasma-steel.png',sort_order:6,active:true},
{id:'10000000-0000-0000-0000-000000000007',name:'Emsan Emirgan 8 Parça Çelik Tencere Seti',price:1299,old_price:2599,stock:47,description:'Parlak çelik gövdeli, farklı boylardan oluşan 8 parçalık tencere seti.',image_url:'/products/emsan-emirgan.png',sort_order:7,active:true}
];
function authorized(req){const expected=process.env.ADMIN_DASHBOARD_TOKEN;return !!expected&&req.headers.get('x-admin-token')===expected;}

export async function POST(req){
  try{
    if(!authorized(req)) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const c=db(); if(!c) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});
    const b=await req.json();
    if(b.action==='seed'){
      const {error}=await c.from('products').upsert(DEMO_PRODUCTS,{onConflict:'id',ignoreDuplicates:true});
      if(error) throw error;
      return NextResponse.json({ok:true,seeded:DEMO_PRODUCTS.length});
    }
    const payload={
      name:clean(b.name,160),description:clean(b.description,800),price:Math.max(0,Number(b.price)||0),old_price:Math.max(0,Number(b.old_price)||0),stock:Math.max(0,Number(b.stock)||0),image_url:clean(b.image_url,500),sort_order:Number(b.sort_order)||0,active:b.active!==false
    };
    if(!payload.name||payload.price<=0) return NextResponse.json({error:'Ürün adı ve fiyat zorunludur.'},{status:400});
    const {data,error}=await c.from('products').insert(payload).select('*').single();
    if(error) throw error;
    return NextResponse.json({product:data});
  }catch(e){return NextResponse.json({error:e.message||'Ürün işlemi başarısız.'},{status:500});}
}

export async function DELETE(req){
  try{
    if(!authorized(req)) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const c=db(); if(!c) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});
    const id=new URL(req.url).searchParams.get('id');
    if(!id) return NextResponse.json({error:'Ürün id eksik.'},{status:400});
    const {error}=await c.from('products').delete().eq('id',id);
    if(error) throw error;
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:e.message||'Ürün silinemedi.'},{status:500});}
}
