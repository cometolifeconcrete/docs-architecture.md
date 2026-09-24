const SUPABASE_URL='https://fjbrdqzvcyenglamraxi.supabase.co';
const TABLE='companycam_photo_reviews';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
function key(){return process.env.SUPABASE_SERVICE_ROLE_KEY}
function headers(){return {'apikey':key(),'Authorization':`Bearer ${key()}`,'Content-Type':'application/json'}}
function validSurface(v){return ['Stamped','Broomed','Aggregate','Pavers'].includes(v)}
function validTreatments(v){return Array.isArray(v)&&v.every(x=>['Sand Blast','Revival'].includes(x))}

export default async function handler(request){
  if(!key()) return json({ok:false,error:'Server persistence is not configured'},500);
  try{
    const url=new URL(request.url);
    if(request.method==='GET'){
      const projectId=url.searchParams.get('project_id');
      if(projectId){
        const r=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?project_id=eq.${encodeURIComponent(projectId)}&select=*`,{headers:headers()});
        const rows=await r.json(); if(!r.ok) return json({ok:false,error:rows},r.status);
        return json({ok:true,review:rows[0]||null});
      }
      const r=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=project_id,status`,{headers:headers()});
      const rows=await r.json(); if(!r.ok) return json({ok:false,error:rows},r.status);
      return json({ok:true,reviews:rows,progress:{reviewed:rows.filter(x=>x.status==='reviewed').length,skipped:rows.filter(x=>x.status==='skipped').length,total:rows.length}});
    }
    if(request.method!=='POST') return json({ok:false,error:'Method not allowed'},405);
    const b=await request.json();
    const status=b.status||'reviewed';
    if(!b.project_id) return json({ok:false,error:'project_id is required'},400);
    if(!['reviewed','skipped'].includes(status)) return json({ok:false,error:'Invalid status'},400);
    if(status==='reviewed'){
      if(!validSurface(b.surface_type)) return json({ok:false,error:'Choose a surface type'},400);
      if(!b.before_photo_id||!b.after_photo_id) return json({ok:false,error:'Choose one Before and one After'},400);
      if(String(b.before_photo_id)===String(b.after_photo_id)) return json({ok:false,error:'Before and After must be different'},400);
    }
    if(!validTreatments(b.treatment_tags||[])) return json({ok:false,error:'Invalid treatment tag'},400);
    const row={project_id:String(b.project_id),project_name:b.project_name||null,surface_type:b.surface_type||null,treatment_tags:b.treatment_tags||[],before_photo_id:b.before_photo_id?String(b.before_photo_id):null,after_photo_id:b.after_photo_id?String(b.after_photo_id):null,glam_photo_ids:(b.glam_photo_ids||[]).map(String),status,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=project_id`,{method:'POST',headers:{...headers(),'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)});
    const out=await r.json(); if(!r.ok) return json({ok:false,error:out},r.status);
    return json({ok:true,review:out[0]||row});
  }catch(e){return json({ok:false,error:e.message||'Unexpected error'},500)}
}