const CC='https://app.companycam.com/public_api/v1';
const SB='https://fjbrdqzvcyenglamraxi.supabase.co';
const TABLE='companycam_photo_reviews';
const out=(res,status,data)=>res.status(status).setHeader('Cache-Control','no-store').json(data);
export default async function handler(req,res){
 if(req.method!=='POST') return out(res,405,{ok:false,error:'POST required'});
 const cc=process.env.COMPANYCAM_API_KEY,sb=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!cc||!sb) return out(res,500,{ok:false,error:'Required server credentials are not configured'});
 const sh={'apikey':sb,'Authorization':`Bearer ${sb}`,'Content-Type':'application/json'};
 try{
  const rr=await fetch(`${SB}/rest/v1/${TABLE}?status=eq.skipped&project_date=is.null&select=project_id,project_name`,{headers:sh});
  const rows=await rr.json(); if(!rr.ok) return out(res,rr.status,{ok:false,error:rows});
  let updated=0,missing=0,failed=0; const details=[];
  for(const row of rows){
   try{
    const cr=await fetch(`${CC}/projects/${encodeURIComponent(row.project_id)}`,{headers:{Authorization:`Bearer ${cc}`,Accept:'application/json'}});
    if(!cr.ok){failed++;details.push({project_id:row.project_id,project_name:row.project_name,status:`companycam_${cr.status}`});continue}
    const payload=await cr.json(),p=payload?.data||payload;
    const date=p?.created_at||p?.updated_at||null;
    if(!date){missing++;details.push({project_id:row.project_id,project_name:row.project_name,status:'no_date'});continue}
    const ur=await fetch(`${SB}/rest/v1/${TABLE}?project_id=eq.${encodeURIComponent(row.project_id)}`,{method:'PATCH',headers:{...sh,Prefer:'return=minimal'},body:JSON.stringify({project_date:date,updated_at:new Date().toISOString()})});
    if(!ur.ok){failed++;details.push({project_id:row.project_id,project_name:row.project_name,status:`supabase_${ur.status}`});continue}
    updated++;details.push({project_id:row.project_id,project_name:row.project_name,status:'updated',project_date:date});
   }catch(e){failed++;details.push({project_id:row.project_id,project_name:row.project_name,status:'error'});}
  }
  return out(res,200,{ok:true,processed:rows.length,updated,missing,failed,details});
 }catch(e){return out(res,500,{ok:false,error:e.message||'Backfill failed'})}
}