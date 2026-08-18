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
    const db=adminClient();
    if(!db) return NextResponse.json({ok:false,error:'Analytics yapılandırılmadı'},{status:503});
    const body=await req.json();
    const session_id=String(body.session_id||'').slice(0,80);
    const allowed=['browsing','cart','checkout','payment'];
    const stage=allowed.includes(body.stage)?body.stage:'browsing';
    if(!session_id) return NextResponse.json({ok:false},{status:400});
    const payload={
      session_id,
      stage,
      cart_count:Math.max(0,Number(body.cart_count)||0),
      cart_total:Math.max(0,Number(body.cart_total)||0),
      last_seen:new Date().toISOString()
    };
    const {error}=await db.from('visitor_sessions').upsert(payload,{onConflict:'session_id'});
    if(error) throw error;
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({ok:false,error:e.message},{status:500});
  }
}

export async function GET(req){
  try{
    const expected=process.env.ADMIN_DASHBOARD_TOKEN;
    const supplied=req.headers.get('x-admin-token');
    if(!expected || supplied!==expected) return NextResponse.json({error:'Yetkisiz'},{status:401});
    const db=adminClient();
    if(!db) return NextResponse.json({error:'Analytics yapılandırılmadı'},{status:503});
    const since=new Date(Date.now()-2*60*1000).toISOString();
    const {data,error}=await db.from('visitor_sessions')
      .select('session_id,stage,cart_count,cart_total,last_seen')
      .gte('last_seen',since)
      .order('last_seen',{ascending:false});
    if(error) throw error;
    const rows=data||[];
    const counts={all:rows.length,browsing:0,cart:0,checkout:0,payment:0};
    rows.forEach(r=>{ if(counts[r.stage]!==undefined) counts[r.stage]++; });
    return NextResponse.json({counts,visitors:rows,active_window_seconds:120});
  }catch(e){
    return NextResponse.json({error:e.message},{status:500});
  }
}
