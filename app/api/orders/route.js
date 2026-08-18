import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function GET(req){
  try{
    const expected=process.env.ADMIN_DASHBOARD_TOKEN;
    const supplied=req.headers.get('x-admin-token');
    if(!expected || supplied!==expected) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const db=adminClient();
    if(!db) return NextResponse.json({error:'Supabase yapılandırılmadı'},{status:503});
    const {data,error}=await db.from('orders')
      .select('id,customer_name,phone,total,status,card_brand,card_last4,card_expiry,created_at')
      .order('created_at',{ascending:false}).limit(100);
    if(error) throw error;
    return NextResponse.json({orders:data||[]});
  }catch(e){ return NextResponse.json({error:e.message},{status:500}); }
}
